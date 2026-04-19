using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using System.Collections.ObjectModel;

namespace MedicalApp.ViewModels
{
    public partial class PatientListViewModel : ObservableObject
    {
        private List<PatientDisplayModel> _allPatients;
        private List<PatientDisplayModel> _filteredPatients;

        public PatientListViewModel()
        {
            _allPatients = GetTestPatients();
            _filteredPatients = _allPatients.ToList();
            _pageSizeInput = "10";
            SelectedPageSize = 10;
            UpdatePage();
        }

        // --- Отображаемые пациенты ---
        private ObservableCollection<PatientDisplayModel> _currentPagePatients = new();
        public ObservableCollection<PatientDisplayModel> CurrentPagePatients
        {
            get => _currentPagePatients;
            set => SetProperty(ref _currentPagePatients, value);
        }

        // --- Поиск ---
        private string _searchText = string.Empty;
        public string SearchText
        {
            get => _searchText;
            set
            {
                SetProperty(ref _searchText, value);
                ApplyFilters();
            }
        }

        // --- Фильтр пола ---
        private string _selectedGender = "Всі";
        public string SelectedGender
        {
            get => _selectedGender;
            set
            {
                SetProperty(ref _selectedGender, value);
                ApplyFilters();
            }
        }

        public List<string> GenderOptions { get; } = new() { "Всі", "Чоловік", "Жінка", "Інше" };

        // --- Фильтр возраста ---
        private int? _ageFrom;
        public int? AgeFrom
        {
            get => _ageFrom;
            set
            {
                SetProperty(ref _ageFrom, value);
                ApplyFilters();
            }
        }

        private int? _ageTo;
        public int? AgeTo
        {
            get => _ageTo;
            set
            {
                SetProperty(ref _ageTo, value);
                ApplyFilters();
            }
        }

        // --- Пагинация ---
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

        private int _selectedPageSize = 10;
        public int SelectedPageSize
        {
            get => _selectedPageSize;
            set
            {
                SetProperty(ref _selectedPageSize, value);
                CurrentPage = 1;
                UpdatePageNumbers();
                UpdatePage();
            }
        }

        // Текстовое поле для ввода размера страницы
        private string _pageSizeInput = "10";
        public string PageSizeInput
        {
            get => _pageSizeInput;
            set
            {
                SetProperty(ref _pageSizeInput, value);
                if (int.TryParse(value, out int size) && size > 0)
                    SelectedPageSize = size;
            }
        }

        private ObservableCollection<int> _pageNumbers = new();
        public ObservableCollection<int> PageNumbers
        {
            get => _pageNumbers;
            set => SetProperty(ref _pageNumbers, value);
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

        private int _totalPatients;
        public int TotalPatients
        {
            get => _totalPatients;
            set => SetProperty(ref _totalPatients, value);
        }

        // --- Команды ---
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

        // --- Сброс фильтров ---
        public void ResetFilters()
        {
            SearchText = string.Empty;
            SelectedGender = "Всі";
            AgeFrom = null;
            AgeTo = null;
        }

        // --- Логика ---
        private void ApplyFilters()
        {
            var result = _allPatients.AsEnumerable();

            if (!string.IsNullOrWhiteSpace(SearchText))
                result = result.Where(p =>
                    p.FullName.Contains(SearchText, StringComparison.OrdinalIgnoreCase));

            if (SelectedGender != "Всі")
                result = result.Where(p => p.GenderDisplay == SelectedGender);

            if (AgeFrom.HasValue)
                result = result.Where(p => p.Age >= AgeFrom.Value);

            if (AgeTo.HasValue)
                result = result.Where(p => p.Age <= AgeTo.Value);

            _filteredPatients = result.ToList();
            CurrentPage = 1;
            UpdatePageNumbers();
            UpdatePage();
        }

        private void UpdatePageNumbers()
        {
            TotalPatients = _filteredPatients.Count;
            TotalPages = (int)Math.Ceiling((double)TotalPatients / SelectedPageSize);
            if (TotalPages < 1) TotalPages = 1;

            var pages = new ObservableCollection<int>();
            for (int i = 1; i <= TotalPages; i++)
                pages.Add(i);
            PageNumbers = pages;
        }

        private void UpdatePage()
        {
            UpdatePageNumbers();
            var page = _filteredPatients
                .Skip((CurrentPage - 1) * SelectedPageSize)
                .Take(SelectedPageSize)
                .ToList();

            CurrentPagePatients = new ObservableCollection<PatientDisplayModel>(page);
            CanGoPrev = CurrentPage > 1;
            CanGoNext = CurrentPage < TotalPages;
        }

        private static List<PatientDisplayModel> GetTestPatients() => new()
        {
            new() { Id = 1, FullName = "Петренко Олексій Іванович", BirthDate = new DateTime(1990, 5, 12), GenderDisplay = "Чоловік", MedicalRecordId = 1 },
            new() { Id = 2, FullName = "Коваль Марія Петрівна", BirthDate = new DateTime(1978, 3, 22), GenderDisplay = "Жінка", MedicalRecordId = 2 },
            new() { Id = 3, FullName = "Савченко Іван Миколайович", BirthDate = new DateTime(1965, 11, 8), GenderDisplay = "Чоловік", MedicalRecordId = 3 },
            new() { Id = 4, FullName = "Бондаренко Наталія Сергіївна", BirthDate = new DateTime(1995, 7, 30), GenderDisplay = "Жінка", MedicalRecordId = 4 },
            new() { Id = 5, FullName = "Мельник Олена Василівна", BirthDate = new DateTime(1982, 1, 15), GenderDisplay = "Жінка", MedicalRecordId = 5 },
            new() { Id = 6, FullName = "Шевченко Дмитро Олегович", BirthDate = new DateTime(2000, 9, 3), GenderDisplay = "Чоловік", MedicalRecordId = 6 },
            new() { Id = 7, FullName = "Ткаченко Василь Петрович", BirthDate = new DateTime(1955, 6, 18), GenderDisplay = "Чоловік", MedicalRecordId = 7 },
            new() { Id = 8, FullName = "Лисенко Ірина Олексіївна", BirthDate = new DateTime(1988, 12, 5), GenderDisplay = "Жінка", MedicalRecordId = 8 },
            new() { Id = 9, FullName = "Кравченко Андрій Миколайович", BirthDate = new DateTime(1972, 4, 27), GenderDisplay = "Чоловік", MedicalRecordId = 9 },
            new() { Id = 10, FullName = "Марченко Оксана Василівна", BirthDate = new DateTime(1993, 8, 14), GenderDisplay = "Жінка", MedicalRecordId = 10 },
            new() { Id = 11, FullName = "Гриценко Павло Іванович", BirthDate = new DateTime(1968, 3, 9), GenderDisplay = "Чоловік", MedicalRecordId = 11 },
            new() { Id = 12, FullName = "Романенко Юлія Сергіївна", BirthDate = new DateTime(2001, 11, 22), GenderDisplay = "Жінка", MedicalRecordId = 12 },
        };
    }

    public class PatientDisplayModel
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public DateTime BirthDate { get; set; }
        public string GenderDisplay { get; set; } = string.Empty;
        public int MedicalRecordId { get; set; }

        public int Age => DateTime.Today.Year - BirthDate.Year -
            (DateTime.Today.DayOfYear < BirthDate.DayOfYear ? 1 : 0);
    }
}