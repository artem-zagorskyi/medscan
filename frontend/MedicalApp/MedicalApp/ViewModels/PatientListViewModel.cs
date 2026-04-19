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
        private List<PatientDisplayModel> _filteredPatients = new();

        public PatientListViewModel()
        {
            _pageSizeInput = "10";
            SelectedPageSize = 10;
            _ = LoadPatientsAsync();
        }

        // --- Завантаження з API ---
        private async Task LoadPatientsAsync()
        {
            try
            {
                IsLoading = true;
                ErrorMessage = string.Empty;

                var doctorPatients = await _patientService.GetByDoctorIdAsync(SessionManager.DoctorId);

                if (doctorPatients != null)
                {
                    _allPatients = doctorPatients
                        .Where(dp => dp.Patient != null)
                        .Select(dp => new PatientDisplayModel
                        {
                            Id = dp.Patient!.Id,
                            FullName = dp.Patient.Person != null
                                ? $"{dp.Patient.Person.LastName} {dp.Patient.Person.FirstName} {dp.Patient.Person.MiddleName}".Trim()
                                : "Невідомий",
                            BirthDate = dp.Patient.Person?.BirthDate ?? DateTime.MinValue,
                            GenderDisplay = dp.Patient.Person?.Gender switch
                            {
                                "MALE" => "Чоловік",
                                "FEMALE" => "Жінка",
                                _ => "Інше"
                            },
                            MedicalRecordId = dp.Patient.MedicalRecordId
                        }).ToList();
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

        // --- Відображувані пацієнти ---
        private ObservableCollection<PatientDisplayModel> _currentPagePatients = new();
        public ObservableCollection<PatientDisplayModel> CurrentPagePatients
        {
            get => _currentPagePatients;
            set => SetProperty(ref _currentPagePatients, value);
        }

        // --- Стан ---
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

        // --- Пошук ---
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

        // --- Фільтр статі ---
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

        // --- Фільтр віку ---
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
            SearchText = string.Empty;
            SelectedGender = "Всі";
            AgeFrom = null;
            AgeTo = null;
        }

        // --- Логіка ---
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