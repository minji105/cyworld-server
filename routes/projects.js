const express = require('express');
const multer = require('multer');
const Project = require('../models/Project');
const router = express.Router();

// Multer 설정: 파일 저장 경로 및 파일명 설정
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

// 파일 크기 제한 (10MB) 설정
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, 
    fieldSize: 50 * 1024 * 1024 
  }
});

router.get('/', async (req, res) => {
  const projects = await Project.find({});
  res.json(projects);
});

router.get('/:title', async (req, res) => {
  const project = await Project.findOne({ title: req.params.title });
  if (project) {
    await project.save();
    res.json(project);
  } else {
    res.status(404).json({ message: 'Project not found' });
  }
});

router.post('/', upload.single('mainImage'), async (req, res) => {
  const { title, content, section, stack } = req.body;
  const mainImage = req.file ? req.file.path : '';

  const newProject = new Project({
    title,
    content,
    section,
    stack: stack.split(','),
    mainImage,
  });

  try {
    await newProject.save();
    res.status(201).json(newProject);
  } catch (error) {
    res.status(400).json({ message: 'Failed to create project', error });
  }
});

// 게시물 이미지 업로드 엔드포인트
router.post('/api/upload', upload.single('image'), (req, res) => {
  if (req.file) {
    res.json({
      message: 'Image uploaded successfully',
      imagePath: `/uploads/${req.file.filename}`
    });
  } else {
    res.status(400).json({ message: 'Image upload failed' });
  }
});

router.put('/:title', upload.single('mainImage'), async (req, res) => {
  try {
    const { title, content, section, stack } = req.body;
    const mainImage = req.file ? req.file.path : req.body.mainImage;

    const updatedProject = await Project.findOneAndUpdate(
      { title: req.params.title },
      { title, content, section, stack: stack.split(','), mainImage },
      { new: true }
    );

    if (!updatedProject) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json(updatedProject);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update project', error });
  }
});

router.delete('/:title', async (req, res) => {
  try {
    const deletedProject = await Project.findOneAndDelete({ title: req.params.title });

    if (!deletedProject) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete project', error });
  }
});

module.exports = router;
