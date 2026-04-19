
namespace MedicalApp.Helpers
{
    public static class SessionManager
    {
        public static int AccountId { get; private set; }
        public static int PersonId { get; private set; }
        public static string Email { get; private set; } = string.Empty;
        public static string Rights { get; private set; } = string.Empty;
        public static string Role { get; private set; } = string.Empty;

        // TODO: получать из GET /api/doctors/person/:personId (добавить роут на бэкенде)
        // Логика: после логина берём person_id из токена → запрос к докторам → получаем specialization
        public static string Specialization { get; private set; } = "Лікар";

        // TODO: получать из GET /api/persons/:personId
        public static string FullName { get; private set; } = string.Empty;

        public static void Set(int accountId, int personId, string email, string rights, string role)
        {
            AccountId = accountId;
            PersonId = personId;
            Email = email;
            Rights = rights;
            Role = role;
        }

        public static void SetDoctorInfo(string fullName, string specialization)
        {
            FullName = fullName;
            Specialization = specialization;
        }

        public static void Clear()
        {
            AccountId = 0;
            PersonId = 0;
            Email = string.Empty;
            Rights = string.Empty;
            Role = string.Empty;
            FullName = string.Empty;
            Specialization = "Лікар";
        }

        public static bool IsAdmin() => Rights == "ADMIN";
    }
}
