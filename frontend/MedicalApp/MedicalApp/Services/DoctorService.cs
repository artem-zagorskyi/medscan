namespace MedicalApp.Services
{
    public class AccountResponse
    {
        public int Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public string Rights { get; set; } = string.Empty;
        public bool IsActive { get; set; }
    }

    public class UpdateDoctorRequest
    {
        public string Specialization { get; set; } = string.Empty;
    }

    public class DoctorResponse
    {
        public int Id { get; set; }
        public int PersonId { get; set; }
        public string Specialization { get; set; } = string.Empty;
        public PersonResponse? Person { get; set; }
    }

    public class PersonResponse
    {
        public int Id { get; set; }
        public string LastName { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string? MiddleName { get; set; }
        public DateTime BirthDate { get; set; }
        public string Gender { get; set; } = string.Empty;
        public string? ContactInfo { get; set; }
        public AccountResponse? Account { get; set; }
        public string FullName => $"{LastName} {FirstName} {MiddleName}".Trim();
    }

    public class DoctorService : BaseApiService
    {
        public async Task<DoctorResponse?> GetByPersonIdAsync(int personId) =>
            await GetAsync<DoctorResponse>($"doctors/person/{personId}");

        public async Task<List<DoctorResponse>?> GetAllAsync() =>
            await GetAsync<List<DoctorResponse>>("doctors");

        public async Task DeactivateAsync(int personId) =>
            await PatchAsync($"accounts/person/{personId}/deactivate", new { });

        public async Task ActivateAsync(int personId) =>
            await PatchAsync($"accounts/person/{personId}/activate", new { });

        public async Task UpdateAsync(int doctorId, UpdateDoctorRequest request) =>
            await PatchAsync($"doctors/{doctorId}", request);
    }
}