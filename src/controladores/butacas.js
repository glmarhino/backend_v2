const express = require('express')
const router = express.Router()
const Factura = require('../modelos/Factura')
const Horario = require('../modelos/Horario')
const Butaca = require('../modelos/Butaca')
const utiles = require('../utiles')
const { body, validationResult } = require('express-validator')

router.get('/:id', async (req, res) => {
  if (!utiles.idValido(req.params.id)) {
    return res.status(404).json({
      error: true,
      mensaje: 'Registro inexistente',
      datos: []
    })
  }

  const horario = await Horario.findById(req.params.id).populate('sala', 'nombre filas columnas').populate('pelicula', 'nombre codigo imagen horas minutos').populate('butacas', 'fila columna')
  if (!horario) {
    return res.status(404).json({
      error: true,
      mensaje: 'Registro inexistente',
      datos: []
    })
  } else {
    res.status(200).json({
      error: false,
      mensaje: 'Registro encontrado',
      datos: horario
    })
  }
})

router.post(
  '/',
  body('nombre').trim().isLength({ min: 3 }).withMessage('Mínimo 3 caracteres').matches(/^[A-Za-z\s]+$/).withMessage('Solo se permiten letras'),
  body('nit').isInt({ min: 0, max: 1000000000 }).withMessage('El máxmimo valor permitido es 1000000000'),
  body('correo').isEmail().normalizeEmail().withMessage('Formato incorrecto'),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(422).json({
        datos: errors.array()
      })
    }
    try {
      const horario = await Horario.findById(req.body.horario)
      const factura = await Factura.create({
        nombre: req.body.nombre,
        nit: req.body.nit,
        correo: req.body.correo,
        horario: horario._id,
        total: (horario.precio * req.body.butacas.length)
      })
      req.body.butacas.forEach(async (butaca) => {
        const nuevo = await Butaca.create({
          factura: factura._id,
          horario: horario._id,
          fila: butaca.fila,
          columna: butaca.columna
        })
        await Factura.findByIdAndUpdate(factura._id, {
          $push: {
            butacas: nuevo
          }
        })
        await Horario.findByIdAndUpdate(horario._id, {
          $inc : {
            butacasVendidas: 1
          },
          $push: {
            butacas: nuevo
          }
        })
      })
      return res.status(200).json({
        error: false,
        mensaje: 'Registro almacenado',
        datos: {
          factura: factura
        }
      })
    } catch(error) {
      return utiles.errorBD(error, res)
    }
  }
)

module.exports = router
