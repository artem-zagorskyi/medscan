namespace MedicalApp.Services
{
    public class PatientDiseaseService : BaseApiService
    {
        public async Task AddAsync(int medicalRecordId, int diseaseId, string status, DateTime diagnosedAt) =>
            await PostAsync("patient-diseases", new
            {
                medical_record_id = medicalRecordId,
                disease_id = diseaseId,
                status,
                diagnosed_at = diagnosedAt.ToString("yyyy-MM-dd")
            });

        public async Task RemoveAsync(int medicalRecordId, int diseaseId) =>
            await DeleteAsync($"patient-diseases/medical-record/{medicalRecordId}/disease/{diseaseId}");

        public async Task UpdateStatusAsync(int medicalRecordId, int diseaseId, string status) =>
            await PatchAsync(
                $"patient-diseases/medical-record/{medicalRecordId}/disease/{diseaseId}/status",
                new { status });
    }
}