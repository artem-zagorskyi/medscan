
namespace MedicalApp.Services
{
    // --- Case ---
    public class CaseResponse
    {
        public int Id { get; set; }
        public int MedicalRecordId { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime OpeningDate { get; set; }
        public DateTime? ClosingDate { get; set; }
        public string? MainCondition { get; set; }
        public string? Description { get; set; }
        public List<RecordResponse> Records { get; set; } = new();
        public List<ResearchResponse> Researches { get; set; } = new();

        public string StatusDisplay => Status == "OPEN" ? "Відкритий" : "Закритий";
        public string OpeningDateDisplay => OpeningDate.ToString("dd.MM.yyyy");
        public string? ClosingDateDisplay => ClosingDate?.ToString("dd.MM.yyyy");
        public int RecordsCount => Records.Count;
    }

    public class CreateCaseRequest
    {
        public int MedicalRecordId { get; set; }
        public string? MainCondition { get; set; }
        public string? Description { get; set; }
        public string? OpeningDate { get; set; }
    }

    public class UpdateCaseRequest
    {
        public string? Status { get; set; }
        public string? MainCondition { get; set; }
        public string? Description { get; set; }
        public string? ClosingDate { get; set; }
    }

    public class CaseService : BaseApiService
    {
        public async Task<List<CaseResponse>?> GetByMedicalRecordAsync(int medicalRecordId) =>
            await GetAsync<List<CaseResponse>>($"cases/medical-record/{medicalRecordId}");

        public async Task<CaseResponse?> GetByIdAsync(int id) =>
            await GetAsync<CaseResponse>($"cases/{id}");

        public async Task<CaseResponse?> CreateAsync(CreateCaseRequest request) =>
            await PostAsync<CaseResponse>("cases", new
            {
                medical_record_id = request.MedicalRecordId,
                main_condition = request.MainCondition,
                description = request.Description,
                opening_date = request.OpeningDate ?? DateTime.Today.ToString("yyyy-MM-dd")
            });

        public async Task<CaseResponse?> UpdateAsync(int id, UpdateCaseRequest request) =>
            await PatchAsync<CaseResponse>($"cases/{id}", new
            {
                status = request.Status,
                main_condition = request.MainCondition,
                description = request.Description,
                closing_date = request.ClosingDate
            });

        public async Task DeleteAsync(int id) =>
            await DeleteAsync($"cases/{id}");
    }
}
