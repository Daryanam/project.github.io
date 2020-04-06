const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    minlenght: 1,
    trim: true
  },

  _collId: {
    type: mongoose.Types.ObjectId,
    require: true
  }
});

const Item = mongoose.model('Item', ItemSchema);

module.exports = { Item }
