using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using MedicalApp.Helpers;
using MedicalApp.Services;
using System.Collections.ObjectModel;

namespace MedicalApp.ViewModels
{
    public partial class PatientListViewModel : ObservableObject
    {
        private readonly PatientService _patientService = new();
        private List<PatientDisplayModel> _allPatients = new();
        private List<PatientDisplayModel> _myPatients = new();
        private List<PatientDisplayModel> _filteredPatients = new();

        public PatientListViewModel()
        {
            _pageSizeInput = "10";
            SelectedPageSize = 10;
            _ = LoadPatientsAsync();
        }

        private async Task LoadPatientsAsync()
        {
            try
            {
                IsLoading = true;
                ErrorMessage = string.Empty;

                // Загружаем всех пациентов
                var allPatients = await _patientService.GetAllAsync();
                if (allPatients != null)
                {
                    _allPatients = allPatients
                        .Select(p => new PatientDisplayModel
                        {
                            Id = p.Id,
                            FullName = p.Person != null
                                ? $"{p.Person.LastName} {p.Person.FirstName} {p.Person.MiddleName}".Trim()
                                : "Невідомий",
                            BirthDate = p.Person?.BirthDate ?? DateTime.MinValue,
                            GenderDisplay = p.Person?.Gender switch
                            {
                                "MALE" => "Чоловік",
                                "FEMALE" => "Жінка",
                                _ => "Інше"
                            },
                            MedicalRecordId = p.MedicalRecordId,
                            IsMyPatient = false
                        }).ToList();
                }

                // Загружаем моих пациентов для пометки
                var doctorPatients = await _patientService.GetByDoctorIdAsync(SessionManager.DoctorId);
                if (doctorPatients != null)
                {
                    var myIds = doctorPatients
                        .Where(dp => dp.Patient != null)
                        .Select(dp => dp.Patient!.Id)
                        .ToHashSet();

                    _myPatients = _allPatients.Where(p => myIds.Contains(p.Id)).ToList();

                    foreach (var p in _allPatients)
                        p.IsMyPatient = myIds.Contains(p.Id);
                }

                _filteredPatients = _allPatients.ToList();
                UpdatePageNumbers();
                UpdatePage();
            }
            catch (Exception ex)
            {
                ErrorMessage = $"Помилка завантаження: {ex.Message}";
            }
            finally
            {
                IsLoading = false;
            }
        }

        // --- Фильтр "только мои" ---
        private bool _onlyMyPatients = false;
        public bool OnlyMyPatients
        {
            get => _onlyMyPatients;
            set
            {
                SetProperty(ref _onlyMyPatients, value);
                ApplyFilters();
            }
        }

        // --- Отображаемые пациенты ---
        private ObservableCollection<PatientDisplayModel> _currentPagePatients = new();
        public ObservableCollection<PatientDisplayModel> CurrentPagePatients
        {
            get => _currentPagePatients;
            set => SetProperty(ref _currentPagePatients, value);
        }

        // --- Состояние ---
        private bool _isLoading;
        public bool IsLoading
        {
            get => _isLoading;
            set => SetProperty(ref _isLoading, value);
        }

        private string _errorMessage = string.Empty;
        public string ErrorMessage
        {
            get => _errorMessage;
            set => SetProperty(ref _errorMessage, value);
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

        public void ResetFilters()
        {
            SearchText = string.Empty;
            SelectedGender = "Всі";
            AgeFrom = null;
            AgeTo = null;
            OnlyMyPatients = false;
        }

        // --- Логика ---
        private void ApplyFilters()
        {
            var result = _allPatients.AsEnumerable();

            if (OnlyMyPatients)
                result = result.Where(p => p.IsMyPatient);

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
    }

    public class PatientDisplayModel
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public DateTime BirthDate { get; set; }
        public string GenderDisplay { get; set; } = string.Empty;
        public int MedicalRecordId { get; set; }
        public bool IsMyPatient { get; set; }

        public int Age => DateTime.Today.Year - BirthDate.Year -
            (DateTime.Today.DayOfYear < BirthDate.DayOfYear ? 1 : 0);

        public string AgeLabel
        {
            get
            {
                int age = Age;
                int mod10 = age % 10;
                int mod100 = age % 100;

                if (mod100 >= 11 && mod100 <= 14)
                    return $"{age} років";
                return mod10 switch
                {
                    1 => $"{age} рік",
                    2 or 3 or 4 => $"{age} роки",
                    _ => $"{age} років"
                };
            }
        }
    }
}