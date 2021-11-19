const express = require("express");
const app = express();
let mongoose = require("mongoose");
let { productosRouter } = require("./routes/productos.js");
let { Productos } = require("./models/productos.js");
let { CRUDproductos } = require("./db/productos.js");
// let cookieParser = require("cookie-parser");
// const MongoStore = require("connect-mongo");
const passport = require("passport");
// const LocalStrategy = require("passport-local").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
// const bCrypt = require("bCrypt");

const session = require("express-session");
const http = require("http").Server(app);
const PORT = 8080;

http.listen(PORT, () => {
  console.log(`Servidor HTTP escuchando en el puerto ${PORT}`);
});

// app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("./public"));
const io = require("socket.io")(http);

app.use("/productos", productosRouter);

// app.use(
//   session({
//     store: MongoStore.create({
//       mongoUrl:
//         "mongodb+srv://gonzalogil:gonzalogil@cluster0.lvfuy.mongodb.net/cookies?retryWrites=true&w=majority",
//       mongoOptions: { useNewUrlParser: true, useUnifiedTopology: true },
//       ttl: 600,
//     }),
//     secret: "123456",
//     resave: false,
//     saveUninitialized: false,
//     rolling: true,
//     cookie: {
//       maxAge: 600000,
//     },
//   })
// );

// *** PASSPORT *** //
app.use(
  session({
    secret: "124356",
    cookie: {
      httpOnly: false,
      secure: false,
      maxAge: 20000,
    },
    rolling: true,
    resave: true,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new FacebookStrategy(
    {
      clientID: "878656336344822",
      clientSecret: "b45ef771977c92b9c0ae87eea04c2c81",
      callbackURL: "/auth/facebook/callback",
      profileFields: ["id", "displayName", "photos", "emails"],
      scope: ["email"],
    },
    function (accessToken, refreshToken, profile, done) {
      let userProfile = profile;
      return done(null, userProfile);
    }
  )
);

passport.serializeUser(function (user, cb) {
  cb(null, user);
});

passport.deserializeUser(function (obj, cb) {
  cb(null, obj);
});

app.get("/login", (req, res) => {
  if (req.isAuthenticated()) {
    res.send(`<div class="alert alert-success p-4">
      <div class="w-50 float-left">
          <h2>Bienvenido</h2>
          <h2>${req.user.displayName}</h2>
      </div>
      <div class="float-right">
          <button class="btn btn-warning" onclick="location.href='/logout'">
              <b>Logout</b><br><img src="${req.user.photos[0].value}" width="75" alt="">
          </button>
      </div>
      <b><a href="#">${req.user.emails[0].value}</a></b>
  </div>
      `);
  } else {
    res.redirect("/");
  }
});

app.get("/auth/facebook", passport.authenticate("facebook"));
app.get(
  "/auth/facebook/callback",
  passport.authenticate("facebook", {
    successRedirect: "/",
    failureRedirect: "/faillogin",
  })
);

app.get("/faillogin", (req, res) => {
  res.send("login-error");
});

app.get("/logout", (req, res) => {
  let nombre = req.user.displayName;
  req.logout();
  res.send(`Hasta luego ${nombre}`);
});

const mensajes = [];

ConectandoaBD();

async function ConectandoaBD() {
  try {
    const URI = "mongodb://localhost:27017/ecommerce";
    await mongoose.connect(URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    await Productos.deleteMany({});
    await Productos.insertMany(db.products, (error) => {
      if (error) {
        throw ` Error al grabar productos ${error}`;
      } else {
        console.log(`Productos grabados...`);
      }
    });
  } catch (error) {
    throw new Error(error.message);
  }
}
let { getChat, nuevoMensaje } = require("./controller/mensajes.js");

let db = new CRUDproductos();

io.on("connection", async (socket) => {
  console.log("conectado!");
  socket.on("broadcast", db.products);
  socket.on("nuevo", async (data) => {
    mensajes.push(data);
    io.sockets.emit("mensajes", mensajes);
    let mensaje = await nuevoMensaje(data);
    io.socket.emit("nuevo-mensaje", mensaje);
  });
  getData();
});

async function getData() {
  try {
    let chat = await getChat();
    socket.emit("data", chat);
  } catch (e) {
    throw new Error(e);
  }
}
