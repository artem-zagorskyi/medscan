namespace MedicalApp.Services
{
    public class RecordMedicationService : BaseApiService
    {
        public async Task AddAsync(int recordId, int medicationId, string? dosage, string? frequency, string? duration, string? comment) =>
            await PostAsync("record-medications", new
            {
                record_id = recordId,
                medication_id = medicationId,
                dosage,
                frequency,
                duration,
                comment
            });

        public async Task RemoveAsync(int id) =>
            await DeleteAsync($"record-medications/{id}");
    }
}