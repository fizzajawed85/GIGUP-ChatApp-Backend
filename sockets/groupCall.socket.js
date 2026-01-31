module.exports = (io) => {
    io.on("connection", (socket) => {
        // Start a group call
        socket.on("startGroupCall", (data) => {
            const { groupId, groupName, callerId, callerName, type } = data;
            console.log(`[GroupCall] ${callerName} starting ${type} call in group ${groupId}`);

            // Join the group call room
            socket.join(`groupCall_${groupId}`);

            // Notify all group members (except caller) about the incoming call
            // Using group_${groupId} room which they joined in group.socket.js
            socket.to(`group_${groupId}`).emit("incomingGroupCall", {
                groupId,
                groupName,
                callerId,
                callerName,
                type
            });
        });

        // Join an existing group call
        socket.on("joinGroupCall", (data) => {
            const { groupId, userId, username } = data;
            console.log(`[GroupCall] ${username} joining call in group ${groupId}`);

            socket.join(`groupCall_${groupId}`);

            // Notify others in the group call room that a new user joined
            socket.to(`groupCall_${groupId}`).emit("userJoinedGroupCall", {
                userId,
                username,
                socketId: socket.id
            });
        });

        // Leave a group call
        socket.on("leaveGroupCall", (data) => {
            const { groupId, userId } = data;
            console.log(`[GroupCall] User ${userId} leaving call in group ${groupId}`);

            socket.leave(`groupCall_${groupId}`);
            socket.to(`groupCall_${groupId}`).emit("userLeftGroupCall", { userId });
        });

        // Relay signaling data between group participants
        socket.on("groupSignal", (data) => {
            const { to, from, signal } = data;
            // Send signal to a specific user (their personal room is their userId)
            io.to(to).emit("groupSignalRelay", {
                from,
                signal
            });
        });

        // End group call for everyone (admin only or last person)
        socket.on("endGroupCall", (groupId) => {
            io.to(`groupCall_${groupId}`).emit("groupCallEnded");
            // Also need to clear rooms? Socket.io handles room cleanup on disconnect usually
        });
    });
};
