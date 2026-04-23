namespace MedicalApp.Services
{
    public class DoctorPatientResponse
    {
        public int PatientId { get; set; }
        public int DoctorId { get; set; }
        public PatientResponse? Patient { get; set; }
    }

    public class PatientResponse
    {
        public int Id { get; set; }
        public int PersonId { get; set; }
        public int MedicalRecordId { get; set; }
        public PersonResponse? Person { get; set; }
    }

    public class PatientService : BaseApiService
    {
        public async Task<List<DoctorPatientResponse>?> GetByDoctorIdAsync(int doctorId) =>
            await GetAsync<List<DoctorPatientResponse>>($"patients/doctor/{doctorId}");
    }
}