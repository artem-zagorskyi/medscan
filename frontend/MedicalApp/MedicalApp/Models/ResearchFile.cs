using MedicalApp.Models.Enums;

namespace MedicalApp.Models
{
    public class ResearchFile
    {
        public int Id { get; set; }
        public int MedicalRecordId { get; set; }
        public int? ResearchId { get; set; }
        public string FilePath { get; set; } = string.Empty;
        public FileStatus Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ProcessedAt { get; set; }
    }
}
