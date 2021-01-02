const axios = require('axios');
const cheerio = require('cheerio');

const getPage = async () => {
  const response = await axios.request({
    method: 'get',
    url: 'https://bni.co.id/en-us/home/forexinformation',
    headers: {
      Accept: 'text/html',
      'Accept-Encoding': 'gzip, deflate, br',
      Pragma: 'no-cache',
      'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:47.0) Gecko/20100101 Firefox/47.0',
    },
  });

  return response.data;
};

const parseNumber = val => {
  return parseFloat(val.replace(/[,]/g, ''));
};

const parseSection = ($, id) => {
  const items = $(`${id} table tbody tr`).map((i, row) => {
    const cols = $('td', row);

    return {
      currency: cols.eq(0).text(),
      buy: parseNumber(cols.eq(2).text()),
      sell: parseNumber(cols.eq(1).text()),
    };
  }).get();

  const dateInfo = $(`${id} .date-infoView span`).text();

  const matches = dateInfo.match(/(\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}).+([+-]\d{2}:\d{2})/);

  if (matches === null) {
    return { items };
  }

  const date = new Date(`${matches[1]} ${matches[2]}`);

  return { last_update: date.toISOString(), idr_rate: items };
};

module.exports = async (req, res) => {
  try {
    const page = await getPage();
    const $ = cheerio.load(page);

    return res.json({
      data: {
        bank_notes: parseSection($, '#dnn_ctr3509_BNIValasInfoView_divSpecial'),
        counter: parseSection($, '#dnn_ctr3509_BNIValasInfoView_divBankNotes'),
      },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};