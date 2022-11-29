const express = require("express");

const bcrypt = require("bcrypt");
const fs = require("fs");
const session = require("express-session");

// Create the Express app
const app = express();

// Use the 'public' folder to serve static files
app.use(express.static("public"));

// Use the json middleware to parse JSON data
app.use(express.json());

// Use the session middleware to maintain sessions
const chatSession = session({
    secret: "game",
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: { maxAge: 300000 }
});
app.use(chatSession);

// This helper function checks whether the text only contains word characters
function containWordCharsOnly(text) {
    return /^\w+$/.test(text);
}

// Handle the /register endpoint
app.post("/register", (req, res) => {
    // Get the JSON data from the body
    const { username, avatar, name, password } = req.body;
    //
    // D. Reading the users.json file
    //
    const users = JSON.parse(fs.readFileSync("data/users.json"))
    //
    // E. Checking for the user data correctness
    //
    // if any box is empty
    if (!username || !avatar || !name || !password){
        res.json({ status:"error",
                   error: "Username/avata/name/password cannot be empty."});
        return;
    }
    // invalid username
    if (!containWordCharsOnly(username)){
        res.json({ status:"error",
                   error: "Username can only contain underscores, letters or numbers."});
        return;
    }    
    // existing username
    if (username in users){
        res.json({ status:"error",
                   error: "Username has already been used."});
        return;
    }    
    //
    // G. Adding the new user account
    //
    // hash the password
    const hash = bcrypt.hashSync(password, 10);
    //add user in the record
    users[username] = {avatar, name, password: hash};
    //
    // H. Saving the users.json file
    //
    fs.writeFileSync("data/users.json", JSON.stringify(users, null, "    "))
    //
    // I. Sending a success response to the browser
    //
    res.json({ status: "success" });
});

// Handle the /signin endpoint
app.post("/signin", (req, res) => {
    // Get the JSON data from the body
    const { username, password } = req.body;
    //
    // D. Reading the users.json file
    //
    const users = JSON.parse(fs.readFileSync("data/users.json"))
    //
    // E. Checking for username/password
    // 
    if (!(username in users) || !bcrypt.compareSync(password, users[username].password)) {
        res.json({ status:"error",
                   error: "Incorrect username or password!"});
        return;
    }
    //
    // G. Sending a success response with the user account
    //
    req.session.user={ username, avatar: users[username].avatar, name: users[username].name}
    res.json({ status: "success", user: {username, avatar: users[username].avatar, name: users[username].name}});
});

// Handle the /validate endpoint
app.get("/validate", (req, res) => {

    //
    // B. Getting req.session.user
    //

    // not signed in, return error
    if (!req.session.user) {
        res.json({ status:"error",
                   error: "You have not signed in."});
        return;
    }
    //
    // D. Sending a success response with the user account
    //
    res.json({ status: "success", user: req.session.user });
});

// Handle the /signout endpoint
app.get("/signout", (req, res) => {

    //
    // Deleting req.session.user
    //
    delete req.session.user;
    //
    // Sending a success response
    //
    res.json({ status: "success", user: null });
});


//
// ***** Please insert your Lab 6 code here *****
//

const { createServer } = require("http");
const { Server } = require("socket.io");
const httpServer = createServer( app );
const io = new Server(httpServer);

const onlineUsers = {}

// Connection (sign in)
io.on("connection", (socket)=>{
    if (socket.request.session.user){
        const { username, avatar, name } = socket.request.session.user;
        onlineUsers[username] = {avatar, name};
        // console.log(onlineUsers)

        //broadcast the signed-in user
        io.emit("add user", JSON.stringify(socket.request.session.user));
    }

    // disconnect (signout)
    socket.on("disconnect", ()=>{
        if (socket.request.session.user){
            const { username } = socket.request.session.user;
            if (onlineUsers[username]) {
                delete onlineUsers[username];
            }
            console.log(onlineUsers)

            //broadcast the signed-out user
            io.emit("remove user", JSON.stringify(socket.request.session.user));
        }
    });

    //send out users info when socket connet (sign in)
    socket.on("get users", ()=>{
        if (socket.request.session.user){
            socket.emit("users", JSON.stringify(onlineUsers));
        }
    });

    //send out messages when socket connet (sign in)
    socket.on("get messages", ()=>{
        const messages = JSON.parse(fs.readFileSync("data/chatroom.json"))
        socket.emit("messages", JSON.stringify(messages));
    });

    //send out messages when input
    socket.on("post message", (content)=>{
        message={   user:     socket.request.session.user,
                    datetime: new Date(),
                    content:  content
        };
        const chatroom = JSON.parse(fs.readFileSync("data/chatroom.json"));
        chatroom.push(message);
        fs.writeFileSync("data/chatroom.json", JSON.stringify(chatroom, null, "    "));

        io.emit("add message",JSON.stringify(message));
    });


    // Invite someone, with names of the invitee and the inviter
    socket.on("invite someone", (username, inviter)=>{
        io.emit("add reminder",JSON.stringify(username), JSON.stringify(inviter));
    });


    // The invitee acceps and inform the inviter to start game
    socket.on("start game", (username, opponent)=>{
        io.emit("inviter start",JSON.stringify(username), JSON.stringify(opponent));
    });

    // Inform opponent your gems count
    socket.on("send gems", (receiver, numGems)=>{
        socket.broadcast.emit("receive gems", JSON.stringify(receiver), JSON.stringify(numGems));
    });
});



io.use((socket, next) => {
    chatSession(socket.request, {}, next);
});

// Use a web server to listen at port 8000
httpServer.listen(8000, () => {
    console.log("The chat server has started...");
});
