const Notification = require("../models/Notification");

module.exports = (io) => {
    io.on("connection", (socket) => {
        // 1. Signaling: Initial Call Request
        socket.on("callUser", async (data) => {
            const { userToCall, signalData, from, callerName, type } = data;
            console.log(`[CallSocket] ${from} is calling ${userToCall} (${type})`);

            // Save notification
            try {
                await Notification.create({
                    recipient: userToCall,
                    sender: from,
                    type: 'call',
                    title: `Incoming ${type === 'video' ? 'Video' : 'Audio'} Call`,
                    content: `${callerName} is calling you...`,
                    data: { from, type }
                });
            } catch (err) {
                console.error("Failed to save call notification:", err);
            }

            io.to(userToCall).emit("incomingCall", {
                signal: signalData,
                from,
                callerName,
                type
            });
        });

        // 2. Signaling: Answering a Call
        socket.on("answerCall", (data) => {
            const { to, signal } = data;
            console.log(`[CallSocket] Call answered from ${socket.id} to ${to}`);
            io.to(to).emit("callAccepted", signal);
        });

        // 3. Signaling: ICE Candidates
        socket.on("iceCandidate", (data) => {
            const { to, candidate } = data;
            console.log(`[CallSocket] ICE Candidate relayed to ${to}`);
            io.to(to).emit("iceCandidate", candidate);
        });

        // 4. End Call Notification
        socket.on("endCall", (data) => {
            const { to } = data;
            console.log(`[CallSocket] Call ended by ${socket.id}, notifying ${to}`);
            io.to(to).emit("callEnded");
        });

        // 5. Decline Call
        socket.on("declineCall", (data) => {
            const { to } = data;
            console.log(`[CallSocket] Call declined by ${socket.id}, notifying ${to}`);
            io.to(to).emit("callDeclined");
        });
    });
};
