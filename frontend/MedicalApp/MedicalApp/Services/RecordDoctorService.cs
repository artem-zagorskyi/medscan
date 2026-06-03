namespace MedicalApp.Services
{
    public class RecordDoctorService : BaseApiService
    {
        public async Task AddAsync(int recordId, int doctorId, string role) =>
            await PostAsync("record-doctors", new
            {
                record_id = recordId,
                doctor_id = doctorId,
                role
            });

        public async Task RemoveAsync(int id) =>
            await DeleteAsync($"record-doctors/{id}");
    }
}