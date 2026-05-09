const Group = require("../models/Group");
const GroupMessage = require("../models/GroupMessage");

const initGroupSocket = (io) => {
    io.on("connection", (socket) => {
        console.log("Group socket connected:", socket.id);

        // Join group room
        socket.on("joinGroup", async (groupId) => {
            try {
                socket.join(`group_${groupId}`);
                console.log(`Socket ${socket.id} joined group ${groupId}`);
            } catch (error) {
                console.error("Error joining group:", error);
            }
        });

        // Leave group room
        socket.on("leaveGroup", (groupId) => {
            socket.leave(`group_${groupId}`);
            console.log(`Socket ${socket.id} left group ${groupId}`);
        });

        // Send group message
        socket.on("groupMessage", async (data) => {
            try {
                const { groupId, senderId, text } = data;

                const group = await Group.findById(groupId);
                if (!group) return;

                // Check if sender is a member
                if (!group.members.some(m => m.toString() === senderId)) {
                    return socket.emit("error", { message: "Not a group member" });
                }

                const newMessage = await GroupMessage.create({
                    group: groupId,
                    sender: senderId,
                    text,
                    readBy: [senderId],
                    status: "sent",
                });

                // Update group's latest message
                group.latestMessage = newMessage._id;

                // Increment unread count for all members except sender
                const senderIdStr = senderId.toString().toLowerCase();
                group.unreadCounts.forEach(uc => {
                    if (uc.user.toString().toLowerCase() !== senderIdStr) {
                        uc.count += 1;
                    } else {
                        uc.count = 0; // Ensure sender count is always 0
                    }
                });

                group.markModified('unreadCounts');

                await group.save();

                const populated = await GroupMessage.findById(newMessage._id)
                    .populate("sender", "username avatar");

                // Add group name for notifications
                const msgData = {
                    ...populated.toObject(),
                    groupName: group.name
                };

                // 1. Emit to the group room for active chat window updates
                io.to(`group_${groupId}`).emit("groupMessage", msgData);

                // 2. Emit to individual rooms for background notifications/sidebar updates
                if (group.members) {
                    group.members.forEach(memberId => {
                        io.to(memberId.toString()).emit("groupMessage", msgData);
                    });
                }
            } catch (error) {
                console.error("Error sending group message:", error);
                socket.emit("error", { message: "Failed to send message" });
            }
        });

        // Group typing indicator
        socket.on("groupTyping", ({ groupId, userId, username }) => {
            socket.to(`group_${groupId}`).emit("groupTyping", { userId, username });
        });

        socket.on("groupStopTyping", ({ groupId, userId }) => {
            socket.to(`group_${groupId}`).emit("groupStopTyping", { userId });
        });

        // Mark group message as read
        socket.on("groupMessageRead", async ({ groupId, messageId, userId }) => {
            try {
                const message = await GroupMessage.findById(messageId);
                if (message && !message.readBy.includes(userId)) {
                    message.readBy.push(userId);
                    await message.save();

                    // Reset unread count for this user
                    const group = await Group.findById(groupId);
                    if (group && group.unreadCounts) {
                        const userIdStr = userId.toString().toLowerCase();
                        const userCount = group.unreadCounts.find(
                            uc => uc.user.toString().toLowerCase() === userIdStr
                        );
                        if (userCount) {
                            userCount.count = 0;
                            group.markModified('unreadCounts');
                            await group.save();
                        }
                    }

                    // Notify group members
                    io.to(`group_${groupId}`).emit("groupMessageRead", {
                        messageId,
                        userId,
                    });
                }
            } catch (error) {
                console.error("Error marking message as read:", error);
            }
        });

        socket.on("disconnect", () => {
            console.log("Group socket disconnected:", socket.id);
        });
    });
};

module.exports = initGroupSocket;
