const { composeAndUploadPrintFiles } = require('../services/printComposer');

exports.composePrintFiles = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sides } = req.body;

    const urls = await composeAndUploadPrintFiles(sides, userId);
    res.json({ urls });
  } catch (error) {
    console.error('[print/compose]', error);
    const status = /Missing|requires|not accessible|Unrecognized|no layers|No printable/i.test(error.message)
      ? 400
      : 500;
    res.status(status).json({ error: error.message || 'Print compose failed' });
  }
};
