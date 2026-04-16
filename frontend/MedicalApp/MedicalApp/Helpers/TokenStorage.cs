using System.IO;
using System.Text.Json;


namespace MedicalApp.Helpers
{
    public class TokenData
    {
        public string Token { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
    }

    public static class TokenStorage
    {
        private static readonly string _filePath = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
            "MedicalApp",
            "token.json"
        );

        public static void Save(string token)
        {
            var data = new TokenData
            {
                Token = token,
                ExpiresAt = DateTime.Now.AddHours(8)
            };

            Directory.CreateDirectory(Path.GetDirectoryName(_filePath)!);
            File.WriteAllText(_filePath, JsonSerializer.Serialize(data));
        }

        public static string? Load()
        {
            if (!File.Exists(_filePath)) return null;

            try
            {
                var data = JsonSerializer.Deserialize<TokenData>(File.ReadAllText(_filePath));
                if (data == null || DateTime.Now > data.ExpiresAt)
                {
                    Clear();
                    return null;
                }
                return data.Token;
            }
            catch
            {
                Clear();
                return null;
            }
        }

        public static void Clear()
        {
            if (File.Exists(_filePath))
                File.Delete(_filePath);
        }

        public static bool IsValid() => Load() != null;
    }
}
