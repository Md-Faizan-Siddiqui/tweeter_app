var express = require("express");
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var cors = require("cors");
var morgan = require("morgan");
var path = require("path")
var jwt = require('jsonwebtoken')

var { userModel,tweetModel } = require('./dbrepo/modules');
var authRoutes = require('./routes/auth')

var SERVER_SECRET = process.env.SECRET || "1234";

var app = express();

var http = require("http");
var socketIO = require("socket.io");
var server = http.createServer(app);
var io = socketIO(server);
const fs = require('fs')
const multer = require('multer')

io.on("connection", () => {
    console.log("chl gya");
})

const storage = multer.diskStorage({ // https://www.npmjs.com/package/multer#diskstorage
    destination: './uploads/',
    filename: function (req, file, cb) {
        cb(null, `${new Date().getTime()}-${file.filename}.${file.mimetype.split("/")[1]}`)
    }
})
var upload = multer({ storage: storage })

const admin = require("firebase-admin");
// https://firebase.google.com/docs/storage/admin/start
var SERVICE_ACCOUNT = JSON.parse(process.env.SERVICE_ACCOUNT)
  

admin.initializeApp({
    credential: admin.credential.cert(SERVICE_ACCOUNT),
    databaseURL: process.env.DATA-BASE-URL
});
const bucket = admin.storage().bucket(process.env.BUCKET);

app.use(bodyParser.json());
app.use(cookieParser());

app.use(cors({
    origin: '*',
    credentials: 'include'
}));

app.use(morgan('dev'));

app.use("/", express.static(path.resolve(path.join(__dirname, "public"))))

app.use('/', authRoutes);

app.use(function(req, res, next) {
    console.log("req.cookies: ", req.cookies);
    if (!req.cookies.jToken) {
        res.status(401).send("include http-only credentials with every request")
        return;
    }
    jwt.verify(req.cookies.jToken, SERVER_SECRET, function(err, decodedData) {
        if (!err) {

            const issueDate = decodedData.iat * 1000;
            const nowDate = new Date().getTime();
            const diff = nowDate - issueDate;

            if (diff > 300000) {
                res.status(401).send("token expired")
            } else {
                var token = jwt.sign({
                    id: decodedData.id,
                    name: decodedData.name,
                    email: decodedData.email,
                }, SERVER_SECRET)
                res.cookie('jToken', token, {
                    maxAge: 86400000,
                    httpOnly: true
                });
                req.body.jToken = decodedData
                next();
            }
        } else {
            res.status(401).send("invalid token")
        }
    });
})

app.get("/profile", (req, res, next) => {

    console.log(req.body)

    userModel.findById(req.body.jToken.id, 'name email profilePic phone gender createdOn',
        function(err, doc) {
            if (!err) {
                res.send({
                    status: 200,
                    profile: doc
                })

            } else {
                res.status(500).send({
                    message: "server error"
                })
            }
        })
})
app.post('/tweet', (req, res, next) => {
    if (!req.body.userName && !req.body.tweet) {
        res.status(403).send({
            message: "please provide email or tweet"
        })
    }

    userModel.findById(req.body.jToken.id ,'email profilePic',(err,user)=>{
        if (err) {
            console.log(err)
        }
        else{
            console.log(req.body.userName)
            var newTweet = new tweetModel({
                "name": req.body.userName,
                "tweets": req.body.tweet,
                "email": user.email,
                "profilePic": user.profilePic
            })
            newTweet.save((err, data) => {
                if (!err) {
                    res.send({
                        status: 200,
                        message: "Post created",
                        data: data
                    })
                    console.log(data.tweets)
                    io.emit("NEW_POST", data)
                } else {
                    console.log(err);
                    res.status(500).send({
                        message: "user create error, " + err
                    })
                }
            });
        }
    })
})
app.get('/getTweets', (req, res, next) => {

    tweetModel.find({}, (err, data) => {
        if (err) {
            console.log(err)
        }
        else {
            console.log(data)
            req.body.data = data
            // data = data[data.length -1]
            res.send(data)
        }
    })
})
app.post("/upload", upload.any(), (req, res, next) => {

    console.log("req.body: ", req.body);
    console.log("req.body: ", JSON.parse(req.body.myDetails));
    console.log("req.files: ", req.files);

    console.log("uploaded file name: ", req.files[0].originalname);
    console.log("file type: ", req.files[0].mimetype);
    console.log("file name in server folders: ", req.files[0].filename);
    console.log("file path in server folders: ", req.files[0].path);

    bucket.upload(
        req.files[0].path,

        function (err, file, apiResponse) {
            if (!err) {
                console.log("api resp: ", apiResponse);

                file.getSignedUrl({
                    action: 'read',
                    expires: '03-09-2491'
                }).then((urlData, err) => {
                    // console.log(req.body.email)
                    if (!err) {
                        // console.log("public downloadable url: ", urlData[0]) // this is public downloadable url 
                        console.log(req.body.email)
                        userModel.findOne({ email: req.body.email }, (err, users) => {
                            console.log(users)
                            if (!err) {
                                users.update({ profilePic: urlData[0] }, {}, function (err, data) {
                                    console.log(users)
                                    res.send({
                                        status: 200,
                                        message: "image uploaded",
                                        picture: users.profilePic
                                    });
                                })
                            }
                            else {
                                res.send({
                                    message: "error"
                                });
                            }
                        })
                        try {
                            fs.unlinkSync(req.files[0].path)
                            //file removed
                        } catch (err) {
                            console.error(err)
                        }
                    }
                })
            } else {
                console.log("err: ", err)
                res.status(500).send();
            }
        });
})


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log("server is running on: ", PORT);
})