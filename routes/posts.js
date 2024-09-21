const express = require('express');
const router = express.Router();
const Post = require('../models/Post');

router.get('/', async (req, res) => {
  const posts = await Post.find({});
  res.json(posts);
});

router.get('/:title', async (req, res) => {
  const post = await Post.findOne({ title: req.params.title });
  if (post) {
    post.views += 1;
    await post.save();
    res.json(post);
  } else {
    res.status(404).json({ message: 'Post not found' });
  }
});

router.post('/', async (req, res) => {
  const newPost = new Post(req.body);
  await newPost.save();
  res.status(201).json(newPost);
});

router.put('/:title', async (req, res) => {
  try {
    const updatedPost = await Post.findOneAndUpdate(
      { title: req.params.title },
      req.body,
      { new: true }
    );
    
    if (!updatedPost) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    res.json(updatedPost);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update post' });
  }
});

router.delete('/:title', async (req, res) => {
  try {
    const deletedPost = await Post.findOneAndDelete({ title: req.params.title });
    
    if (!deletedPost) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete post' });
  }
});



module.exports = router;
