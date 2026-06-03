namespace MedicalApp.Services
{
    public class PatientAllergyService : BaseApiService
    {
        public async Task AddAsync(int medicalRecordId, int allergenId, string severity, DateTime diagnosedAt) =>
            await PostAsync($"patient-allergies", new
            {
                medical_record_id = medicalRecordId,
                allergen_id = allergenId,
                reaction_severity = severity,
                diagnosed_at = diagnosedAt.ToString("yyyy-MM-dd")
            });

        public async Task RemoveAsync(int medicalRecordId, int allergenId) =>
            await DeleteAsync($"patient-allergies/medical-record/{medicalRecordId}/allergen/{allergenId}");

        public async Task UpdateSeverityAsync(int medicalRecordId, int allergenId, string severity) =>
            await PatchAsync(
                $"patient-allergies/medical-record/{medicalRecordId}/allergen/{allergenId}/severity",
                new { reaction_severity = severity });
    }
}