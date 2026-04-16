using MedicalApp.Models.Enums;

namespace MedicalApp.Models
{
    public class Person
    {
        public int Id { get; set; }
        public string LastName { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string? MiddleName { get; set; }
        public DateTime BirthDate { get; set; }
        public Gender Gender { get; set; }
        public string? ContactInfo { get; set; }
    }
}
