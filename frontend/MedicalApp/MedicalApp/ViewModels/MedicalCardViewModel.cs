using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using MedicalApp.Models.Enums;
using System.Collections.ObjectModel;

namespace MedicalApp.ViewModels
{
    public partial class MedicalCardViewModel : ObservableObject
    {
        private List<MedicalRecordEntryModel> _allEntries;

        public MedicalCardViewModel(PatientDisplayModel patient)
        {
            Patient = patient;
            LoadMockData();
        }

        // --- Пацієнт ---
        public PatientDisplayModel Patient { get; }

        // --- Медкарта ---
        private string _bloodGroup = string.Empty;
        public string BloodGroup
        {
            get => _bloodGroup;
            set => SetProperty(ref _bloodGroup, value);
        }

        private string _rhFactor = string.Empty;
        public string RhFactor
        {
            get => _rhFactor;
            set => SetProperty(ref _rhFactor, value);
        }

        // --- Алергії ---
        private ObservableCollection<AllergyDisplayModel> _allergies = new();
        public ObservableCollection<AllergyDisplayModel> Allergies
        {
            get => _allergies;
            set => SetProperty(ref _allergies, value);
        }

        // --- Діагнози ---
        private ObservableCollection<DiagnosisDisplayModel> _diagnoses = new();
        public ObservableCollection<DiagnosisDisplayModel> Diagnoses
        {
            get => _diagnoses;
            set => SetProperty(ref _diagnoses, value);
        }

        // --- Історія записів ---
        private ObservableCollection<MedicalRecordEntryModel> _currentEntries = new();
        public ObservableCollection<MedicalRecordEntryModel> CurrentEntries
        {
            get => _currentEntries;
            set => SetProperty(ref _currentEntries, value);
        }

        // --- Фільтр ---
        private string _selectedEntryType = "Всі";
        public string SelectedEntryType
        {
            get => _selectedEntryType;
            set
            {
                SetProperty(ref _selectedEntryType, value);
                ApplyFilters();
            }
        }

        public List<string> EntryTypeOptions { get; } = new()
        {
            "Всі", "Візит", "Призначення дослідження", "Огляд дослідження"
        };

        // --- Пагінація ---
        private int _currentPage = 1;
        public int CurrentPage
        {
            get => _currentPage;
            set
            {
                SetProperty(ref _currentPage, value);
                UpdatePage();
            }
        }

        private int _totalPages = 1;
        public int TotalPages
        {
            get => _totalPages;
            set => SetProperty(ref _totalPages, value);
        }

        private int _totalEntries;
        public int TotalEntries
        {
            get => _totalEntries;
            set => SetProperty(ref _totalEntries, value);
        }

        private bool _canGoPrev;
        public bool CanGoPrev
        {
            get => _canGoPrev;
            set => SetProperty(ref _canGoPrev, value);
        }

        private bool _canGoNext;
        public bool CanGoNext
        {
            get => _canGoNext;
            set => SetProperty(ref _canGoNext, value);
        }

        private int _pageSize = 5;
        public int PageSize
        {
            get => _pageSize;
            set => SetProperty(ref _pageSize, value);
        }

        private ObservableCollection<int> _pageNumbers = new();
        public ObservableCollection<int> PageNumbers
        {
            get => _pageNumbers;
            set => SetProperty(ref _pageNumbers, value);
        }

        // --- Команди ---
        [RelayCommand]
        private void PrevPage()
        {
            if (CurrentPage > 1) CurrentPage--;
        }

        [RelayCommand]
        private void NextPage()
        {
            if (CurrentPage < TotalPages) CurrentPage++;
        }

        [RelayCommand]
        private void GoToPage(int page)
        {
            if (page >= 1 && page <= TotalPages)
                CurrentPage = page;
        }

        public void ResetFilters()
        {
            SelectedEntryType = "Всі";
        }

        // --- Логіка ---
        private void ApplyFilters()
        {
            var result = _allEntries.AsEnumerable();

            if (SelectedEntryType != "Всі")
                result = result.Where(e => e.EntryTypeDisplay == SelectedEntryType);

            var filtered = result.OrderByDescending(e => e.VisitDate).ToList();
            TotalEntries = filtered.Count;
            TotalPages = (int)Math.Ceiling((double)TotalEntries / PageSize);
            if (TotalPages < 1) TotalPages = 1;

            var pages = new ObservableCollection<int>();
            for (int i = 1; i <= TotalPages; i++)
                pages.Add(i);
            PageNumbers = pages;

            CurrentPage = 1;
            UpdatePage();
        }

        private void UpdatePage()
        {
            var filtered = _allEntries.AsEnumerable();

            if (SelectedEntryType != "Всі")
                filtered = filtered.Where(e => e.EntryTypeDisplay == SelectedEntryType);

            var page = filtered
                .OrderByDescending(e => e.VisitDate)
                .Skip((CurrentPage - 1) * PageSize)
                .Take(PageSize)
                .ToList();

            CurrentEntries = new ObservableCollection<MedicalRecordEntryModel>(page);
            CanGoPrev = CurrentPage > 1;
            CanGoNext = CurrentPage < TotalPages;
        }

        // --- Тестові дані ---
        private void LoadMockData()
        {
            BloodGroup = "A (II)";
            RhFactor = "+";

            Allergies = new ObservableCollection<AllergyDisplayModel>
            {
                new() { Name = "Пеніцилін", Severity = "Важка", SeverityColor = "#FCEBEB", SeverityTextColor = "#A32D2D" },
                new() { Name = "Горіхи", Severity = "Помірна", SeverityColor = "#FAEEDA", SeverityTextColor = "#854F0B" },
                new() { Name = "Пилок", Severity = "Легка", SeverityColor = "#EAF3DE", SeverityTextColor = "#3B6D11" },
            };

            Diagnoses = new ObservableCollection<DiagnosisDisplayModel>
            {
                new() { IcdCode = "I10", Name = "Гіпертонія", Description = "1 стадія, контрольована", Status = "Активна", DiagnosedAt = new DateTime(2021, 6, 2), StatusColor = "#FCEBEB", StatusTextColor = "#A32D2D" },
                new() { IcdCode = "E11.9", Name = "Діабет 2 типу", Description = "Без ускладнень", Status = "Хронічна", DiagnosedAt = new DateTime(2022, 11, 15), StatusColor = "#FAEEDA", StatusTextColor = "#854F0B" },
                new() { IcdCode = "J06.9", Name = "Гострий бронхіт", Description = "Вірусний, неускладнений", Status = "Одужав", DiagnosedAt = new DateTime(2024, 1, 10), StatusColor = "#EAF3DE", StatusTextColor = "#3B6D11" },
            };

            _allEntries = new List<MedicalRecordEntryModel>
            {
                new() {
                    VisitDate = new DateTime(2026, 4, 12),
                    EntryTypeDisplay = "Візит",
                    DoctorName = "Іванов О.П.",
                    Specialization = "Кардіологія",
                    Complaints = "АТ 128/82, пульс 72. Покращення стану.",
                    Conclusion = "Продовжити поточну терапію. Повторний аналіз ліпідів через 3 місяці.",
                    IconColor = "#E6F1FB",
                    IconText = "В"
                },
                new() {
                    VisitDate = new DateTime(2026, 4, 10),
                    EntryTypeDisplay = "Огляд дослідження",
                    DoctorName = "Лаб. Сінево",
                    Specialization = "Загальний аналіз крові",
                    Complaints = "Гемоглобін 13.4 г/дл, лейкоцити 6.8×10⁹/л, тромбоцити 248×10⁹/л.",
                    Conclusion = "Всі показники в межах норми.",
                    IconColor = "#EAF3DE",
                    IconText = "Д",
                    ResearchStatus = "Оброблено",
                    ResearchStatusColor = "#EAF3DE",
                    ResearchStatusTextColor = "#3B6D11"
                },
                new() {
                    VisitDate = new DateTime(2026, 3, 28),
                    EntryTypeDisplay = "Візит",
                    DoctorName = "Коваленко С.О.",
                    Specialization = "Терапія",
                    Complaints = "Біль у горлі, температура 37.8°C.",
                    Conclusion = "Гострий фарингіт. Симптоматичне лікування.",
                    IconColor = "#E6F1FB",
                    IconText = "В"
                },
                new() {
                    VisitDate = new DateTime(2026, 3, 15),
                    EntryTypeDisplay = "Огляд дослідження",
                    DoctorName = "Лаб. Сінево",
                    Specialization = "HbA1c тест",
                    Complaints = "Результат: 6.8% (норма <7.0%).",
                    Conclusion = "Глікемічний контроль стабільний на метформіні 1000мг.",
                    IconColor = "#EAF3DE",
                    IconText = "Д",
                    ResearchStatus = "Оброблено",
                    ResearchStatusColor = "#EAF3DE",
                    ResearchStatusTextColor = "#3B6D11"
                },
                new() {
                    VisitDate = new DateTime(2026, 2, 5),
                    EntryTypeDisplay = "Призначення дослідження",
                    DoctorName = "Іванов О.П.",
                    Specialization = "Гастроентерологія",
                    Complaints = "Дискомфорт в епігастрії 3 тижні.",
                    Conclusion = "Направлення на ендоскопію верхніх відділів ШКТ.",
                    IconColor = "#FAEEDA",
                    IconText = "П"
                },
                new() {
                    VisitDate = new DateTime(2026, 1, 10),
                    EntryTypeDisplay = "Візит",
                    DoctorName = "Накамура Л.В.",
                    Specialization = "Сімейна медицина",
                    Complaints = "Щорічний огляд. Вітальні показники стабільні.",
                    Conclusion = "Оновлено вакцинацію. Консультація щодо дієти та фізичних навантажень.",
                    IconColor = "#E6F1FB",
                    IconText = "В"
                },
            };

            ApplyFilters();
        }
    }

    // --- Допоміжні моделі ---
    public class AllergyDisplayModel
    {
        public string Name { get; set; } = string.Empty;
        public string Severity { get; set; } = string.Empty;
        public string SeverityColor { get; set; } = string.Empty;
        public string SeverityTextColor { get; set; } = string.Empty;
    }

    public class DiagnosisDisplayModel
    {
        public string IcdCode { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime DiagnosedAt { get; set; }
        public string DiagnosedAtDisplay => DiagnosedAt.ToString("dd.MM.yyyy");
        public string StatusColor { get; set; } = string.Empty;
        public string StatusTextColor { get; set; } = string.Empty;
    }

    public class MedicalRecordEntryModel
    {
        public DateTime VisitDate { get; set; }
        public string VisitDateDisplay => VisitDate.ToString("dd.MM.yyyy");
        public string EntryTypeDisplay { get; set; } = string.Empty;
        public string DoctorName { get; set; } = string.Empty;
        public string Specialization { get; set; } = string.Empty;
        public string? Complaints { get; set; }
        public string? Conclusion { get; set; }
        public string IconColor { get; set; } = string.Empty;
        public string IconText { get; set; } = string.Empty;
        public string? ResearchStatus { get; set; }
        public string? ResearchStatusColor { get; set; }
        public string? ResearchStatusTextColor { get; set; }
    }
}
