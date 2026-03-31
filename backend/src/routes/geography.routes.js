/**
 * ULEZI XPB — Rotas de Geografia
 * Fornece listas de províncias e municípios de Angola
 */
const express = require('express');
const router  = express.Router();

// Lista de províncias de Angola
const PROVINCIAS = [
  'Bengo','Benguela','Bié','Cabinda','Cuando Cubango',
  'Cuanza Norte','Cuanza Sul','Cunene','Huambo','Huíla',
  'Luanda','Lunda Norte','Lunda Sul','Malanje','Moxico',
  'Namibe','Uíge','Zaire',
];

// Municípios por província (principais)
const MUNICIPIOS = {
  'Luanda':        ['Luanda','Belas','Cacuaco','Cazenga','Icolo e Bengo','Kilamba Kiaxi','Quiçama','Talatona','Viana'],
  'Benguela':      ['Benguela','Baía Farta','Balombo','Bocoio','Caimbambo','Chongoroi','Cubal','Ganda','Lobito'],
  'Huambo':        ['Huambo','Bailundo','Caála','Catchiungo','Chicala-Cholohanga','Chinjenje','Ecunha','Londuimbali','Longonjo','Mungo','Ucuma'],
  'Bié':           ['Kuito','Andulo','Camacupa','Catabola','Chinguar','Chitembo','Cunhinga','Nharea'],
  'Malanje':       ['Malanje','Cacuso','Calandula','Cambundi-Catembo','Cangandala','Caombo','Cuaba Nzoji','Cunda-Dia-Baze','Luquembo','Marimba','Massango','Mucari','Quela','Quirima'],
  'Huíla':         ['Lubango','Caconda','Cacula','Caluquembe','Chibia','Chicomba','Chipindo','Cuvango','Gambos','Humpata','Jamba','Matala','Quilengues','Quipungo'],
  'Cabinda':       ['Cabinda','Belize','Buco-Zau','Cacongo'],
  'Uíge':          ['Uíge','Alto Cauale','Ambuíla','Bembe','Buengas','Bungo','Damba','Macocola','Maquela do Zombo','Milunga','Mucaba','Negage','Puri','Quimbele','Quitexe','Sanza Pombo','Songo','Zombo'],
  'Cuanza Norte':  ['Ndalatando','Ambaca','Banga','Bolongongo','Cambambe','Cazengo','Golungo Alto','Gonguembo','Lucala','Quiculungo','Samba Caju'],
  'Cuanza Sul':    ['Sumbe','Amboim','Cassongue','Cela','Conda','Ebo','Egito','Kibala','Kilenda','Libolo','Mussende','Porto Amboim','Quibala','Quilenda','Seles'],
  'Lunda Norte':   ['Dundo','Cambulo','Capenda-Camulemba','Caungula','Chitato','Cuango','Cuílo','Lubalo','Lucapa','Xá-Muteba'],
  'Lunda Sul':     ['Saurimo','Cacolo','Dala','Muconda'],
  'Moxico':        ['Luena','Alto Zambeze','Bundas','Camanongue','Léua','Luacano','Luchazes','Lumeje','Moxico'],
  'Cuando Cubango':['Menongue','Calai','Cuangar','Cuchi','Dirico','Mavinga','Nancova','Rivungo'],
  'Cunene':        ['Ondjiva','Cahama','Cuanhama','Curoca','Namacunde','Ombadja'],
  'Namibe':        ['Moçâmedes','Bibala','Camucuio','Tômbwa','Virei'],
  'Bengo':         ['Caxito','Ambriz','Bula Atumba','Dande','Dembos','Icolo e Bengo','Muxima','Nambuangongo','Pango Aluquém'],
  'Zaire':         ['Mbanza Kongo','Cuimba','Nóqui','Nzeto','São Salvador do Congo','Soyo','Tomboco'],
};

/**
 * GET /api/geografia/provincias
 * Lista todas as províncias de Angola
 */
router.get('/provincias', (req, res) => {
  res.json({
    sucesso: true,
    success: true,
    dados: PROVINCIAS,
    data: PROVINCIAS,
  });
});

/**
 * GET /api/geografia/municipios?provincia=Luanda
 * Lista municípios de uma província
 */
router.get('/municipios', (req, res) => {
  const { provincia } = req.query;
  if (!provincia) {
    return res.status(400).json({ sucesso: false, mensagem: 'Parâmetro "provincia" é obrigatório.' });
  }
  const municipios = MUNICIPIOS[provincia] || [];
  res.json({
    sucesso: true,
    success: true,
    dados: municipios,
    data: municipios,
  });
});

module.exports = router;
