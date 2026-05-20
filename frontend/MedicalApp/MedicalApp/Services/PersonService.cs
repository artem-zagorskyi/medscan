namespace MedicalApp.Services
{
    public class UpdatePersonRequest
    {
        public string? ContactInfo { get; set; }
    }

    public class PersonService : BaseApiService
    {
        public async Task UpdateAsync(int personId, UpdatePersonRequest request) =>
            await PatchAsync($"persons/{personId}", request);
    }
}