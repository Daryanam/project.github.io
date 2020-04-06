const mongoose = require('mongoose')

const CollSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    minlenght: 1,
    trim: true
  },
  _userId: {
        type: mongoose.Types.ObjectId,
        required: true
    }
});


const Coll = mongoose.model('Coll', CollSchema);

module.exports = { Coll }
