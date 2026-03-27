import * as doctorPatientService from '../services/doctorPatientService.js'

// GET /api/doctor-patient/patient/:patientId/doctors
export const getDoctorsByPatient = async (req, res) => {
  try {
    const data = await doctorPatientService.getDoctorsByPatient(Number(req.params.patientId))
    res.status(200).json(data)
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

// GET /api/doctor-patient/doctor/:doctorId/patients
export const getPatientsByDoctor = async (req, res) => {
  try {
    const data = await doctorPatientService.getPatientsByDoctor(Number(req.params.doctorId))
    res.status(200).json(data)
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}
