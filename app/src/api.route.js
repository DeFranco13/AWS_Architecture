const { Router } = require('express');
const multer = require('multer');
const upload = multer({ dest: '../files/' }).single('file');
const { createUpload, getUpload, getUploads, deleteUpload } = require('./postgres');
//const { createUpload, getUpload, getUploads, deleteUpload } = require('./in-memory');
const { uploadToS3, downloadFromS3 } = require('./s3');
const { requiresAuth } = require('express-openid-connect');

const router = Router();

router.use(function (req, res, next) {
  res.locals.user = req.oidc.user;
  next();
});

router.get('/', (req, res) => {
  res.json('Hello World!');
});

router.post('/uploads', requiresAuth(), upload, async (req, res) => {
  const { filename } = req.body;
  let mimetype, size;
  if (req.file) {
    mimetype = req.file.mimetype;
    size = req.file.size;
  }
  const { id } = await createUpload(mimetype, size, filename, res.locals.user.nickname);

  if (req.file) {
    await uploadToS3(req.file.path, id.toString());
  }
  res.json({ id });
});

router.get('/uploads', requiresAuth(), async (req, res) => {
  const uploads = await getUploads(res.locals.user.nickname);
  res.json(uploads);
});

router.get('/uploads/:id', requiresAuth(), async (req, res) => {
  const upload = await getUpload(req.params.id, res.locals.user.nickname);
  if (upload) {
    res.json(upload);
  } else {
    res.status(404).json({ error: 'Upload niet gevonden' });
  }
});

router.delete('/uploads/:id', requiresAuth(), async (req, res) => {
  const upload = await getUpload(req.params.id, res.locals.user.nickname);
  if (upload) {
    await deleteUpload(req.params.id, res.locals.user.nickname);
    res.json({ message: 'ok' });
  } else {
    res.status(404).json({ error: 'Upload niet gevonden' });
  }
});

router.get('/file/:id', requiresAuth(), async (req, res) => {
  const upload = await getUpload(req.params.id, res.locals.user.nickname);

  if (upload) {
    const body = await downloadFromS3(req.params.id);
    body.pipe(res);
  } else {
    res.status(404).json({ error: 'Upload niet gevonden' });
  }
});

module.exports = router;
