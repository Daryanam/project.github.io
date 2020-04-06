const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('./config/db');
const passport = require('passport');
const path = require('path');
const config = require('./config/db');
const jwt = require('jsonwebtoken');

const { Coll } = require('./models/coll.model');
const { Item } = require('./models/item.model');
const { User } = require('./models/user.model');

const app = express();

const port = 3000;

app.use(cors());

app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'public')));

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, HEAD, OPTIONS, PUT, PATCH, DELETE");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-access-token, x-refresh-token, _id");

    res.header(
        'Access-Control-Expose-Headers',
        'x-access-token, x-refresh-token'
    );

    next();
});

let authenticate = (req, res, next) => {
    let token = req.header('x-access-token');
    jwt.verify(token, User.getJWTSecret(), (err, decoded) => {
        if (err) {
            res.status(401).send(err);
        } else {
            req.user_id = decoded._id;
            next();
        }
    });
}

let verifySession = (req, res, next) => {
    let refreshToken = req.header('x-refresh-token');
    let _id = req.header('_id');

    User.findByIdAndToken(_id, refreshToken).then((user) => {
        if (!user) {
            return Promise.reject({
                'error': 'User not found. Make sure that the refresh token and user id are correct'
            });
        }
        req.user_id = user._id;
        req.userObject = user;
        req.refreshToken = refreshToken;

        let isSessionValid = false;

        user.sessions.forEach((session) => {
            if (session.token === refreshToken) {
                if (User.hasRefreshTokenExpired(session.expiresAt) === false) {
                    isSessionValid = true;
                }
            }
        });

        if (isSessionValid) {
            next();
        } else {
            return Promise.reject({
                'error': 'Refresh token has expired or the session is invalid'
            })
        }
    }).catch((e) => {
        res.status(401).send(e);
    })
}


app.get('/', (req, res) => {
  res.send('home');
});

app.get('/dashboard', (req, res) => {
  res.send('dashboard');
});


app.get('/colls', (req, res) => {
  Coll.find({
        _userId: req.user_id
    }).then((colls) => {
        res.send(colls);
    }).catch((e) => {
        res.send(e);
    });
})

app.post('/colls', (req, res) => {
  let title = req.body.title;
  let newColl = new Coll({
    title,
    _userId: req.user_id
  });
  newColl.save().then((collDoc) => {
    res.send(collDoc);
  })
});

app.patch('/colls/:id', (req, res) => {
  Coll.findOneAndUpdate({ _id: req.params.id}, {
    $set: req.body
  }).then(() => {
    res.send({ 'message': 'updated successfully'});
  });
});

app.delete('/colls/:id', (req, res) => {
  Coll.findOneAndRemove({
    _id: req.params.id,
    _userId: req.user_id
  }).then((removedCollDoc) => {
    res.send(removedCollDoc);
    deleteItemFromColl(removedCollDoc._id);
  })
});

app.get('/colls/:collId/items', (req, res) => {
  Item.find({
      _collId: req.params.collId
    }).then((items) => {
        res.send(items);
    })
});

app.post('/colls/:collId/items', (req, res) => {
    let newItem = new Item({
      title: req.body.title,
      author: req.body.author,
      descr: req.body.descr,
      _collId: req.params.collId
    });
      newItem.save().then((newItemDoc) => {
        res.send(newItemDoc);
      })

    })


app.patch('/colls/:collId/items/:itemId', (req, res) => {
  Item.findOneAndUpdate({
    _id: req.params.itemId,
    _collId: req.params.collId
  }, {
    $set: req.body
    }
  ).then(() => {
    res.sendStatus(200);
  })
});

app.delete('/colls/:collId/items/:itemId', (req, res) => {
  Item.findOneAndRemove({
    _id: req.params.itemId,
    _collId: req.params.collId
  }).then((removedItemDoc) => {
    res.send(removedItemDoc);
  })
});

app.post('/users', (req, res) => {
    let body = req.body;
    let newUser = new User(body);
    newUser.save().then(() => {
        return newUser.createSession();
    }).then((refreshToken) => {
        return newUser.generateAccessAuthToken().then((accessToken) => {
            return { accessToken, refreshToken }
        });
    }).then((authTokens) => {
        res
            .header('x-refresh-token', authTokens.refreshToken)
            .header('x-access-token', authTokens.accessToken)
            .send(newUser);
    }).catch((e) => {
        res.status(400).send(e);
    })
})

app.post('/users/login', (req, res) => {
    let email = req.body.email;
    let password = req.body.password;

    User.findByCredentials(email, password).then((user) => {
        return user.createSession().then((refreshToken) => {
          return user.generateAccessAuthToken().then((accessToken) => {
                return { accessToken, refreshToken }
            });
        }).then((authTokens) => {
            res
                .header('x-refresh-token', authTokens.refreshToken)
                .header('x-access-token', authTokens.accessToken)
                .send(user);
        })
    }).catch((e) => {
        res.status(400).send(e);
    });
})

app.get('/users/me/access-token', verifySession, (req, res) => {
    req.userObject.generateAccessAuthToken().then((accessToken) => {
        res.header('x-access-token', accessToken).send({ accessToken });
    }).catch((e) => {
        res.status(400).send(e);
    });
})

app.listen(port, () => {
    console.log("Server go on port 3000...")
})
