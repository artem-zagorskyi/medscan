using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using MedicalApp.Helpers;
using MedicalApp.Services;
using System.Collections.ObjectModel;

namespace MedicalApp.ViewModels
{
    public partial class NewRecordViewModel : ObservableObject
    {
        private readonly RecordService _recordService = new();
        private readonly ResearchService _researchService = new();
        private readonly AllergenService _allergenService = new();
        private readonly DiseaseService _diseaseService = new();
        private readonly PatientAllergyService _patientAllergyService = new();
        private readonly PatientDiseaseService _patientDiseaseService = new();

        private readonly int _medicalRecordId;

        public Action? OnSaved { get; set; }

        public NewRecordViewModel(PatientDisplayModel patient, FullMedicalRecordResponse record)
        {
            Patient = patient;
            _medicalRecordId = record.Id;
            _ = LoadDataAsync();
        }

        public PatientDisplayModel Patient { get; }

        // --- Стан ---
        private bool _isLoading;
        public bool IsLoading
        {
            get => _isLoading;
            set => SetProperty(ref _isLoading, value);
        }

        private bool _isSaving;
        public bool IsSaving
        {
            get => _isSaving;
            set => SetProperty(ref _isSaving, value);
        }

        private string _errorMessage = string.Empty;
        public string ErrorMessage
        {
            get => _errorMessage;
            set => SetProperty(ref _errorMessage, value);
        }

        // --- Основні поля ---
        private string _complaints = string.Empty;
        public string Complaints
        {
            get => _complaints;
            set => SetProperty(ref _complaints, value);
        }

        private string _doctorConclusion = string.Empty;
        public string DoctorConclusion
        {
            get => _doctorConclusion;
            set => SetProperty(ref _doctorConclusion, value);
        }

        private string _treatmentPlan = string.Empty;
        public string TreatmentPlan
        {
            get => _treatmentPlan;
            set => SetProperty(ref _treatmentPlan, value);
        }

        // --- Замовлення дослідження ---
        private bool _orderResearch;
        public bool OrderResearch
        {
            get => _orderResearch;
            set
            {
                SetProperty(ref _orderResearch, value);
                if (value) AttachResearch = false;
            }
        }

        private string _researchType = string.Empty;
        public string ResearchType
        {
            get => _researchType;
            set => SetProperty(ref _researchType, value);
        }

        // --- Прив'язка дослідження ---
        private bool _attachResearch;
        public bool AttachResearch
        {
            get => _attachResearch;
            set
            {
                SetProperty(ref _attachResearch, value);
                if (value) OrderResearch = false;
            }
        }

        private ObservableCollection<ResearchItemResponse> _pendingResearches = new();
        public ObservableCollection<ResearchItemResponse> PendingResearches
        {
            get => _pendingResearches;
            set => SetProperty(ref _pendingResearches, value);
        }

        private ResearchItemResponse? _selectedResearch;
        public ResearchItemResponse? SelectedResearch
        {
            get => _selectedResearch;
            set => SetProperty(ref _selectedResearch, value);
        }

        // --- Алергії ---
        private ObservableCollection<EditAllergyModel> _newAllergies = new();
        public ObservableCollection<EditAllergyModel> NewAllergies
        {
            get => _newAllergies;
            set => SetProperty(ref _newAllergies, value);
        }

        private ObservableCollection<AllergenItemResponse> _availableAllergens = new();
        public ObservableCollection<AllergenItemResponse> AvailableAllergens
        {
            get => _availableAllergens;
            set => SetProperty(ref _availableAllergens, value);
        }

        private AllergenItemResponse? _selectedAllergen;
        public AllergenItemResponse? SelectedAllergen
        {
            get => _selectedAllergen;
            set => SetProperty(ref _selectedAllergen, value);
        }

        private string _selectedNewAllergySeverity = "MILD";
        public string SelectedNewAllergySeverity
        {
            get => _selectedNewAllergySeverity;
            set => SetProperty(ref _selectedNewAllergySeverity, value);
        }

        public List<string> SeverityOptions { get; } = new() { "MILD", "MODERATE", "SEVERE" };
        public List<string> SeverityDisplayOptions { get; } = new() { "Легка", "Помірна", "Важка" };

        private string _allergenSearchText = string.Empty;
        public string AllergenSearchText
        {
            get => _allergenSearchText;
            set
            {
                SetProperty(ref _allergenSearchText, value);
                _ = SearchAllergensAsync(value);
            }
        }

        // --- Діагнози ---
        private ObservableCollection<EditDiagnosisModel> _newDiagnoses = new();
        public ObservableCollection<EditDiagnosisModel> NewDiagnoses
        {
            get => _newDiagnoses;
            set => SetProperty(ref _newDiagnoses, value);
        }

        private ObservableCollection<DiseaseItemResponse> _availableDiseases = new();
        public ObservableCollection<DiseaseItemResponse> AvailableDiseases
        {
            get => _availableDiseases;
            set => SetProperty(ref _availableDiseases, value);
        }

        private DiseaseItemResponse? _selectedDisease;
        public DiseaseItemResponse? SelectedDisease
        {
            get => _selectedDisease;
            set => SetProperty(ref _selectedDisease, value);
        }

        private string _selectedNewDiseaseStatus = "ACTIVE";
        public string SelectedNewDiseaseStatus
        {
            get => _selectedNewDiseaseStatus;
            set => SetProperty(ref _selectedNewDiseaseStatus, value);
        }

        public List<string> DiseaseStatusOptions { get; } = new() { "ACTIVE", "CHRONIC", "RECOVERED" };
        public List<string> DiseaseStatusDisplayOptions { get; } = new() { "Активна", "Хронічна", "Одужав" };

        private string _diseaseSearchText = string.Empty;
        public string DiseaseSearchText
        {
            get => _diseaseSearchText;
            set
            {
                SetProperty(ref _diseaseSearchText, value);
                _ = SearchDiseasesAsync(value);
            }
        }

        // --- Завантаження ---
        private async Task LoadDataAsync()
        {
            try
            {
                IsLoading = true;

                var allergens = await _allergenService.GetAllAsync();
                if (allergens != null)
                    AvailableAllergens = new ObservableCollection<AllergenItemResponse>(allergens);

                var diseases = await _diseaseService.GetAllAsync();
                if (diseases != null)
                    AvailableDiseases = new ObservableCollection<DiseaseItemResponse>(diseases);

                var researches = await _researchService.GetByMedicalRecordAsync(_medicalRecordId);
                if (researches != null)
                {
                    var pending = researches.Where(r => r.Status == "PENDING").ToList();
                    PendingResearches = new ObservableCollection<ResearchItemResponse>(pending);
                }
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

        // --- Пошук ---
        private async Task SearchAllergensAsync(string query)
        {
            try
            {
                var results = string.IsNullOrWhiteSpace(query)
                    ? await _allergenService.GetAllAsync()
                    : await _allergenService.SearchAsync(query);
                if (results != null)
                    AvailableAllergens = new ObservableCollection<AllergenItemResponse>(results);
            }
            catch { }
        }

        private async Task SearchDiseasesAsync(string query)
        {
            try
            {
                var results = string.IsNullOrWhiteSpace(query)
                    ? await _diseaseService.GetAllAsync()
                    : await _diseaseService.SearchAsync(query);
                if (results != null)
                    AvailableDiseases = new ObservableCollection<DiseaseItemResponse>(results);
            }
            catch { }
        }

        // --- Команди алергій ---
        [RelayCommand]
        private async Task AddAllergyAsync()
        {
            if (SelectedAllergen == null) return;
            if (NewAllergies.Any(a => a.AllergenId == SelectedAllergen.Id))
            {
                ErrorMessage = "Ця алергія вже додана";
                return;
            }

            NewAllergies.Add(new EditAllergyModel
            {
                AllergenId = SelectedAllergen.Id,
                Name = SelectedAllergen.Name,
                Severity = SelectedNewAllergySeverity,
                SeverityDisplay = SelectedNewAllergySeverity switch
                {
                    "SEVERE" => "Важка",
                    "MODERATE" => "Помірна",
                    _ => "Легка"
                },
                SeverityColor = SelectedNewAllergySeverity switch
                {
                    "SEVERE" => "#FCEBEB",
                    "MODERATE" => "#FAEEDA",
                    _ => "#EAF3DE"
                },
                SeverityTextColor = SelectedNewAllergySeverity switch
                {
                    "SEVERE" => "#A32D2D",
                    "MODERATE" => "#854F0B",
                    _ => "#3B6D11"
                }
            });

            SelectedAllergen = null;
            AllergenSearchText = string.Empty;
            ErrorMessage = string.Empty;
        }

        [RelayCommand]
        private void RemoveAllergy(EditAllergyModel allergy) =>
            NewAllergies.Remove(allergy);

        // --- Команди діагнозів ---
        [RelayCommand]
        private async Task AddDiseaseAsync()
        {
            if (SelectedDisease == null) return;
            if (NewDiagnoses.Any(d => d.DiseaseId == SelectedDisease.Id))
            {
                ErrorMessage = "Цей діагноз вже додано";
                return;
            }

            NewDiagnoses.Add(new EditDiagnosisModel
            {
                DiseaseId = SelectedDisease.Id,
                IcdCode = SelectedDisease.IcdCode,
                Name = SelectedDisease.Name,
                Status = SelectedNewDiseaseStatus,
                StatusDisplay = SelectedNewDiseaseStatus switch
                {
                    "ACTIVE" => "Активна",
                    "CHRONIC" => "Хронічна",
                    _ => "Одужав"
                },
                DiagnosedAt = DateTime.Today,
                StatusColor = SelectedNewDiseaseStatus switch
                {
                    "ACTIVE" => "#FCEBEB",
                    "CHRONIC" => "#FAEEDA",
                    _ => "#EAF3DE"
                },
                StatusTextColor = SelectedNewDiseaseStatus switch
                {
                    "ACTIVE" => "#A32D2D",
                    "CHRONIC" => "#854F0B",
                    _ => "#3B6D11"
                }
            });

            SelectedDisease = null;
            DiseaseSearchText = string.Empty;
            ErrorMessage = string.Empty;
        }

        [RelayCommand]
        private void RemoveDiagnosis(EditDiagnosisModel diagnosis) =>
            NewDiagnoses.Remove(diagnosis);

        // --- Зберегти ---
        [RelayCommand]
        private async Task SaveAsync()
        {
            if (string.IsNullOrWhiteSpace(Complaints) && string.IsNullOrWhiteSpace(DoctorConclusion))
            {
                ErrorMessage = "Заповніть хоча б скарги або висновок";
                return;
            }

            if (OrderResearch && string.IsNullOrWhiteSpace(ResearchType))
            {
                ErrorMessage = "Вкажіть тип дослідження";
                return;
            }

            if (AttachResearch && SelectedResearch == null)
            {
                ErrorMessage = "Виберіть дослідження";
                return;
            }

            try
            {
                IsSaving = true;
                ErrorMessage = string.Empty;

                // Визначаємо тип запису
                string entryType = "VISIT";
                int? researchId = null;

                if (OrderResearch)
                {
                    entryType = "RESEARCH_ORDERED";
                    var research = await _researchService.CreateAsync(_medicalRecordId, ResearchType);
                    researchId = research?.Id;
                }
                else if (AttachResearch && SelectedResearch != null)
                {
                    entryType = "RESEARCH_REVIEW";
                    researchId = SelectedResearch.Id;
                    await _researchService.UpdateStatusAsync(SelectedResearch.Id, "PROCESSING");
                }

                // Створюємо запис
                await _recordService.CreateAsync(new CreateRecordRequest
                {
                    MedicalRecordId = _medicalRecordId,
                    DoctorId = SessionManager.DoctorId,
                    VisitDate = DateTime.Today.ToString("yyyy-MM-dd"),
                    EntryType = entryType,
                    Complaints = string.IsNullOrWhiteSpace(Complaints) ? null : Complaints,
                    DoctorConclusion = string.IsNullOrWhiteSpace(DoctorConclusion) ? null : DoctorConclusion,
                    TreatmentPlan = string.IsNullOrWhiteSpace(TreatmentPlan) ? null : TreatmentPlan,
                    ResearchId = researchId
                });

                // Зберігаємо алергії
                foreach (var allergy in NewAllergies)
                {
                    try
                    {
                        await _patientAllergyService.AddAsync(
                            _medicalRecordId,
                            allergy.AllergenId,
                            allergy.Severity,
                            DateTime.Today
                        );
                    }
                    catch { }
                }

                // Зберігаємо діагнози
                foreach (var diagnosis in NewDiagnoses)
                {
                    try
                    {
                        await _patientDiseaseService.AddAsync(
                            _medicalRecordId,
                            diagnosis.DiseaseId,
                            diagnosis.Status,
                            DateTime.Today
                        );
                    }
                    catch { }
                }

                // Повертаємось до медкарти
                var mainWindow = (MainWindow)App.Current.MainWindow;
                OnSaved?.Invoke();
                //mainWindow.NavigateTo(new Views.MedicalCardView(Patient));
            }
            catch (ApiException ex)
            {
                ErrorMessage = ex.Message;
            }
            catch (Exception ex)
            {
                ErrorMessage = $"Помилка збереження: {ex.Message}";
            }
            finally
            {
                IsSaving = false;
            }
        }
    }
}