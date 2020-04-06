const mongoose = require('mongoose');

mongoose.Promise = global.Promise;
mongoose.connect('mongodb+srv://Darya:<12345>@cluster0-bmsnc.mongodb.net/test?retryWrites=true&w=majority', { useNewUrlParser: true }).then(() => {
  console.log('Connection to mongDB');
}).catch((e) => {
    console.log("Error while attempting to connect to MongoDB");
    console.log(e);
});

mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);

module.exports = {
  db:'mongodb://localhost:27017/website',
  secret: 'secret'
};
