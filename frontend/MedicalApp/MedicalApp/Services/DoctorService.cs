using MedicalApp.Helpers;

namespace MedicalApp.Services
{
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
        public string FullName => $"{LastName} {FirstName} {MiddleName}".Trim();
    }

    public class DoctorService : BaseApiService
    {
        public async Task<DoctorResponse?> GetByPersonIdAsync(int personId) =>
            await GetAsync<DoctorResponse>($"doctors/person/{personId}");
    }
}