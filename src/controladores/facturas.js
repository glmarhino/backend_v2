const express = require('express')
const router = express.Router()
const Horario = require('../modelos/Horario')
const Factura = require('../modelos/Factura')
const utiles = require('../utiles')

router.get('/:id', async (req, res) => {
  if (!utiles.idValido(req.params.id)) {
    return res.status(404).json({
      error: true,
      mensaje: 'Registro inexistente',
      datos: []
    })
  }

  const horario = await Horario.findById(req.params.id).select('precio horaInicio pelicula sala').populate('pelicula', 'nombre codigo').populate('sala', 'nombre')
  if (!horario) {
    return res.status(404).json({
      error: true,
      mensaje: 'Registro inexistente',
      datos: []
    })
  } else {
    const facturas = await Factura.paginate({
      horario: horario._id
    }, {
      sort: {
        createdAt: 1
      },
      page: req.query.page || 1,
      limit: req.query.limit || 10
    })

    res.status(200).json({
      error: false,
      mensaje: 'Lista de registros',
      datos: {
        horario: horario,
        facturas: facturas
      }
    })
  }
})

module.exports = router
