const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  section: {
    type: String,
    required: true,
  },
  stack: {
    type: [String],
    required: true,
  },
  mainImage: {
    type: String,
    required: true,
  },
  image: {
    type: String,
  }
});

module.exports = mongoose.model('Project', ProjectSchema);
