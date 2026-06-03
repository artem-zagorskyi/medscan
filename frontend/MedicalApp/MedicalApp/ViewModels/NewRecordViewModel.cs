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
        private readonly CaseService _caseService = new();
        private readonly AllergenService _allergenService = new();
        private readonly DiseaseService _diseaseService = new();
        private readonly PatientAllergyService _patientAllergyService = new();
        private readonly PatientDiseaseService _patientDiseaseService = new();
        private readonly MedicationService _medicationService = new();
        private readonly RecordDoctorService _recordDoctorService = new();
        private readonly RecordMedicationService _recordMedicationService = new();
        private readonly RecordResearchService _recordResearchService = new();
        private readonly DoctorService _doctorService = new();

        private FullMedicalRecordResponse _record;

        public Action? OnSaved { get; set; }
        public FullMedicalRecordResponse Record => _record;

        private readonly MedicalRecordService _medicalRecordService = new();

        public void AddCase(CaseDisplayModel newCase)
        {
            Cases.Insert(0, newCase);
        }

        public NewRecordViewModel(PatientDisplayModel patient, FullMedicalRecordResponse record, CaseDisplayModel? preselectedCase)
        {
            Patient = patient;
            _record = record;

            Cases = new ObservableCollection<CaseDisplayModel>(
                record.Cases
                    .Where(c => c.Status == "OPEN")
                    .Select(c => new CaseDisplayModel
                    {
                        Id = c.Id,
                        MedicalRecordId = c.MedicalRecordId,
                        Status = c.Status,
                        StatusDisplay = "Відкритий",
                        StatusColor = "#EAF3DE",
                        StatusTextColor = "#3B6D11",
                        OpeningDate = c.OpeningDate,
                        MainCondition = c.MainCondition ?? "—",
                        Description = c.Description,
                        RecordsCount = c.Records.Count,
                    })
            );

            if (preselectedCase != null)
            {
                SelectedCase = Cases.FirstOrDefault(c => c.Id == preselectedCase.Id)
                               ?? preselectedCase;
                CurrentStep = 2;
                _ = LoadCaseDataAsync();
            }
            else
            {
                CurrentStep = 1;
            }

            _ = LoadDataAsync();
        }

        public PatientDisplayModel Patient { get; }

        // --- Шаги ---
        private int _currentStep = 1;
        public int CurrentStep
        {
            get => _currentStep;
            set
            {
                SetProperty(ref _currentStep, value);
                OnPropertyChanged(nameof(IsStep1));
                OnPropertyChanged(nameof(IsStep2));
                OnPropertyChanged(nameof(StepTitle));
            }
        }

        public bool IsStep1 => CurrentStep == 1;
        public bool IsStep2 => CurrentStep == 2;

        public string StepTitle => CurrentStep == 1
            ? "Оберіть кейс"
            : $"Новий запис — {SelectedCase?.MainCondition ?? ""}";

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
            set
            {
                SetProperty(ref _errorMessage, value);
                OnPropertyChanged(nameof(HasError));
            }
        }

        public bool HasError => !string.IsNullOrEmpty(ErrorMessage);

        // --- Кейси ---
        private ObservableCollection<CaseDisplayModel> _cases = new();
        public ObservableCollection<CaseDisplayModel> Cases
        {
            get => _cases;
            set => SetProperty(ref _cases, value);
        }

        private CaseDisplayModel? _selectedCase;
        public CaseDisplayModel? SelectedCase
        {
            get => _selectedCase;
            set
            {
                SetProperty(ref _selectedCase, value);
                OnPropertyChanged(nameof(StepTitle));
            }
        }

        // --- Тип запису ---
        public List<string> RecordTypeOptions { get; } = new() { "EXAM", "CONSILIUM", "EPICRISIS" };
        public List<string> RecordTypeDisplayOptions { get; } = new() { "Огляд", "Консиліум", "Епікриз" };

        private string _selectedRecordType = "EXAM";
        public string SelectedRecordType
        {
            get => _selectedRecordType;
            set
            {
                SetProperty(ref _selectedRecordType, value);
                OnPropertyChanged(nameof(IsConsilium));
            }
        }

        public bool IsConsilium => SelectedRecordType == "CONSILIUM";

        // --- Чернетка ---
        private bool _isDraft = false;
        public bool IsDraft
        {
            get => _isDraft;
            set => SetProperty(ref _isDraft, value);
        }

        // --- Основні поля ---
        private string _complaints = string.Empty;
        public string Complaints
        {
            get => _complaints;
            set => SetProperty(ref _complaints, value);
        }

        private string _historyOfIllness = string.Empty;
        public string HistoryOfIllness
        {
            get => _historyOfIllness;
            set => SetProperty(ref _historyOfIllness, value);
        }

        private string _historyOfLife = string.Empty;
        public string HistoryOfLife
        {
            get => _historyOfLife;
            set => SetProperty(ref _historyOfLife, value);
        }

        private string _socialHabits = string.Empty;
        public string SocialHabits
        {
            get => _socialHabits;
            set => SetProperty(ref _socialHabits, value);
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

        // --- Об'єктивний статус ---
        private string _generalCondition = string.Empty;
        public string GeneralCondition
        {
            get => _generalCondition;
            set => SetProperty(ref _generalCondition, value);
        }

        private string _skinStatus = string.Empty;
        public string SkinStatus
        {
            get => _skinStatus;
            set => SetProperty(ref _skinStatus, value);
        }

        private string _respiratorySystem = string.Empty;
        public string RespiratorySystem
        {
            get => _respiratorySystem;
            set => SetProperty(ref _respiratorySystem, value);
        }

        private string _cardiovascular = string.Empty;
        public string Cardiovascular
        {
            get => _cardiovascular;
            set => SetProperty(ref _cardiovascular, value);
        }

        private bool _isExamStatusExpanded;
        public bool IsExamStatusExpanded
        {
            get => _isExamStatusExpanded;
            set => SetProperty(ref _isExamStatusExpanded, value);
        }

        // --- Вітальні показники ---
        private string _temperature = string.Empty;
        public string Temperature
        {
            get => _temperature;
            set => SetProperty(ref _temperature, value);
        }

        private string _bloodPressure = string.Empty;
        public string BloodPressure
        {
            get => _bloodPressure;
            set => SetProperty(ref _bloodPressure, value);
        }

        private string _heartRate = string.Empty;
        public string HeartRate
        {
            get => _heartRate;
            set => SetProperty(ref _heartRate, value);
        }

        private string _spo2 = string.Empty;
        public string Spo2
        {
            get => _spo2;
            set => SetProperty(ref _spo2, value);
        }

        private string _weight = string.Empty;
        public string Weight
        {
            get => _weight;
            set => SetProperty(ref _weight, value);
        }

        private string _height = string.Empty;
        public string Height
        {
            get => _height;
            set => SetProperty(ref _height, value);
        }

        private bool _isVitalsExpanded;
        public bool IsVitalsExpanded
        {
            get => _isVitalsExpanded;
            set => SetProperty(ref _isVitalsExpanded, value);
        }

        // --- Анамнез ---
        private bool _isAnamnesisExpanded;
        public bool IsAnamnesisExpanded
        {
            get => _isAnamnesisExpanded;
            set => SetProperty(ref _isAnamnesisExpanded, value);
        }

        // --- Parent record ---
        private ObservableCollection<RecordSelectItem> _availableParentRecords = new();
        public ObservableCollection<RecordSelectItem> AvailableParentRecords
        {
            get => _availableParentRecords;
            set => SetProperty(ref _availableParentRecords, value);
        }

        private RecordSelectItem? _selectedParentRecord;
        public RecordSelectItem? SelectedParentRecord
        {
            get => _selectedParentRecord;
            set => SetProperty(ref _selectedParentRecord, value);
        }

        // --- Лікарі консиліуму ---
        private ObservableCollection<ConsiliumDoctorModel> _consiliumDoctors = new();
        public ObservableCollection<ConsiliumDoctorModel> ConsiliumDoctors
        {
            get => _consiliumDoctors;
            set => SetProperty(ref _consiliumDoctors, value);
        }

        private ObservableCollection<DoctorSelectItem> _availableDoctors = new();
        public ObservableCollection<DoctorSelectItem> AvailableDoctors
        {
            get => _availableDoctors;
            set => SetProperty(ref _availableDoctors, value);
        }

        private DoctorSelectItem? _selectedConsiliumDoctor;
        public DoctorSelectItem? SelectedConsiliumDoctor
        {
            get => _selectedConsiliumDoctor;
            set => SetProperty(ref _selectedConsiliumDoctor, value);
        }

        private string _consiliumDoctorRole = "Консультант";
        public string ConsiliumDoctorRole
        {
            get => _consiliumDoctorRole;
            set => SetProperty(ref _consiliumDoctorRole, value);
        }

        private bool _isConsiliumExpanded;
        public bool IsConsiliumExpanded
        {
            get => _isConsiliumExpanded;
            set => SetProperty(ref _isConsiliumExpanded, value);
        }

        // --- Медикаменти ---
        private ObservableCollection<NewMedicationModel> _newMedications = new();
        public ObservableCollection<NewMedicationModel> NewMedications
        {
            get => _newMedications;
            set => SetProperty(ref _newMedications, value);
        }

        private ObservableCollection<MedicationItemResponse> _availableMedications = new();
        public ObservableCollection<MedicationItemResponse> AvailableMedications
        {
            get => _availableMedications;
            set => SetProperty(ref _availableMedications, value);
        }

        private MedicationItemResponse? _selectedMedication;
        public MedicationItemResponse? SelectedMedication
        {
            get => _selectedMedication;
            set => SetProperty(ref _selectedMedication, value);
        }

        private string _medicationDosage = string.Empty;
        public string MedicationDosage
        {
            get => _medicationDosage;
            set => SetProperty(ref _medicationDosage, value);
        }

        private string _medicationFrequency = string.Empty;
        public string MedicationFrequency
        {
            get => _medicationFrequency;
            set => SetProperty(ref _medicationFrequency, value);
        }

        private string _medicationDuration = string.Empty;
        public string MedicationDuration
        {
            get => _medicationDuration;
            set => SetProperty(ref _medicationDuration, value);
        }

        private string _medicationComment = string.Empty;
        public string MedicationComment
        {
            get => _medicationComment;
            set => SetProperty(ref _medicationComment, value);
        }

        private bool _isMedicationsExpanded;
        public bool IsMedicationsExpanded
        {
            get => _isMedicationsExpanded;
            set => SetProperty(ref _isMedicationsExpanded, value);
        }

        // --- Дослідження з пагінацією ---
        private List<ResearchSelectItem> _allCaseResearches = new();

        private ObservableCollection<ResearchSelectItem> _caseResearches = new();
        public ObservableCollection<ResearchSelectItem> CaseResearches
        {
            get => _caseResearches;
            set => SetProperty(ref _caseResearches, value);
        }

        private int _researchPage = 1;
        public int ResearchPage
        {
            get => _researchPage;
            set { SetProperty(ref _researchPage, value); UpdateResearchPage(); }
        }

        private int _researchTotalPages = 1;
        public int ResearchTotalPages
        {
            get => _researchTotalPages;
            set { SetProperty(ref _researchTotalPages, value); OnPropertyChanged(nameof(ShowResearchPagination)); }
        }

        public bool ShowResearchPagination => ResearchTotalPages > 1;

        private bool _canGoResearchPrev;
        public bool CanGoResearchPrev
        {
            get => _canGoResearchPrev;
            set => SetProperty(ref _canGoResearchPrev, value);
        }

        private bool _canGoResearchNext;
        public bool CanGoResearchNext
        {
            get => _canGoResearchNext;
            set => SetProperty(ref _canGoResearchNext, value);
        }

        private bool _isResearchesExpanded;
        public bool IsResearchesExpanded
        {
            get => _isResearchesExpanded;
            set => SetProperty(ref _isResearchesExpanded, value);
        }

        private readonly int _researchPageSize = 5;

        private void UpdateResearchPage()
        {
            var page = _allCaseResearches
                .Skip((ResearchPage - 1) * _researchPageSize)
                .Take(_researchPageSize)
                .ToList();
            CaseResearches = new ObservableCollection<ResearchSelectItem>(page);
            CanGoResearchPrev = ResearchPage > 1;
            CanGoResearchNext = ResearchPage < ResearchTotalPages;
        }

        [RelayCommand]
        private void ResearchPrevPage() { if (ResearchPage > 1) ResearchPage--; }

        [RelayCommand]
        private void ResearchNextPage() { if (ResearchPage < ResearchTotalPages) ResearchPage++; }

        public async Task ReloadResearchesAsync()
        {
            // Перезавантажуємо дані з бекенду
            var fresh = await _medicalRecordService.GetFullRecordAsync(_record.Id);
            if (fresh != null)
            {
                // Оновлюємо колекції в _record
                _record.Researches = fresh.Researches;
                _record.ResearchFiles = fresh.ResearchFiles;
                _record.Cases = fresh.Cases;
            }
            await LoadCaseDataAsync();
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

        private bool _isAllergiesExpanded;
        public bool IsAllergiesExpanded
        {
            get => _isAllergiesExpanded;
            set => SetProperty(ref _isAllergiesExpanded, value);
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

        private bool _isDiagnosesExpanded;
        public bool IsDiagnosesExpanded
        {
            get => _isDiagnosesExpanded;
            set => SetProperty(ref _isDiagnosesExpanded, value);
        }

        // --- Завантаження ---
        private async Task LoadDataAsync()
        {
            try
            {
                IsLoading = true;

                // Існуючі діагнози медкарти (IsNew = false — не можна видалити)
                NewDiagnoses = new ObservableCollection<EditDiagnosisModel>(
                    _record.PatientDiseases.Select(d => new EditDiagnosisModel
                    {
                        DiseaseId = d.Disease?.Id ?? 0,
                        IcdCode = d.Disease?.IcdCode ?? "—",
                        Name = d.Disease?.Name ?? "—",
                        Status = d.Status,
                        StatusDisplay = d.Status switch
                        {
                            "ACTIVE" => "Активна",
                            "CHRONIC" => "Хронічна",
                            _ => "Одужав"
                        },
                        DiagnosedAt = d.DiagnosedAt,
                        StatusColor = d.Status switch
                        {
                            "ACTIVE" => "#FCEBEB",
                            "CHRONIC" => "#FAEEDA",
                            _ => "#EAF3DE"
                        },
                        StatusTextColor = d.Status switch
                        {
                            "ACTIVE" => "#A32D2D",
                            "CHRONIC" => "#854F0B",
                            _ => "#3B6D11"
                        },
                        IsNew = false
                    })
                );

                // Існуючі алергії медкарти (IsNew = false — не можна видалити)
                NewAllergies = new ObservableCollection<EditAllergyModel>(
                    _record.PatientAllergies.Select(a => new EditAllergyModel
                    {
                        AllergenId = a.Allergen?.Id ?? 0,
                        Name = a.Allergen?.Name ?? "—",
                        Severity = a.ReactionSeverity,
                        SeverityDisplay = a.ReactionSeverity switch
                        {
                            "SEVERE" => "Важка",
                            "MODERATE" => "Помірна",
                            _ => "Легка"
                        },
                        SeverityColor = a.ReactionSeverity switch
                        {
                            "SEVERE" => "#FCEBEB",
                            "MODERATE" => "#FAEEDA",
                            _ => "#EAF3DE"
                        },
                        SeverityTextColor = a.ReactionSeverity switch
                        {
                            "SEVERE" => "#A32D2D",
                            "MODERATE" => "#854F0B",
                            _ => "#3B6D11"
                        },
                        IsNew = false
                    })
                );

                var allergens = await _allergenService.GetAllAsync();
                if (allergens != null)
                    AvailableAllergens = new ObservableCollection<AllergenItemResponse>(allergens);

                var diseases = await _diseaseService.GetAllAsync();
                if (diseases != null)
                    AvailableDiseases = new ObservableCollection<DiseaseItemResponse>(diseases);

                var medications = await _medicationService.GetAllAsync();
                if (medications != null)
                    AvailableMedications = new ObservableCollection<MedicationItemResponse>(medications);
            }
            catch { }
            finally
            {
                IsLoading = false;
            }
        }

        private async Task LoadCaseDataAsync()
        {
            if (SelectedCase == null) return;
            try
            {
                var caseData = _record.Cases.FirstOrDefault(c => c.Id == SelectedCase.Id);
                if (caseData != null)
                {
                    var alreadyLinkedIds = caseData.Records
        .SelectMany(r => r.RecordResearches)
        .Where(rr => rr.Research != null)
        .Select(rr => rr.Research!.Id)
        .ToHashSet();

                    // 1. Дослідження прив'язані до цього кейсу
                    var caseResearchItems = caseData.Researches.Select(r => new ResearchSelectItem
                    {
                        Id = r.Id,
                        ResearchType = r.ResearchType,
                        StatusDisplay = alreadyLinkedIds.Contains(r.Id)
                            ? "Вже прив'язано до іншого запису"
                            : r.StatusDisplay,
                        IsFromFile = false,
                        FilePath = null,
                        IsDisabled = alreadyLinkedIds.Contains(r.Id),
                        IsSelected = false
                    });

                    // 2. Оброблені дослідження без кейсу (можна прив'язати)
                    var caseResearchIds = caseData.Researches.Select(r => r.Id).ToHashSet();
                    var unassignedResearchItems = _record.Researches
                        .Where(r => r.CaseId == null && !caseResearchIds.Contains(r.Id))
                        .Select(r => new ResearchSelectItem
                        {
                            Id = r.Id,
                            ResearchType = r.ResearchType,
                            StatusDisplay = r.StatusDisplay + " (без кейсу)",
                            IsFromFile = false,
                            FilePath = null,
                            IsDisabled = false,
                            IsSelected = false
                        });

                    // 3. Необроблені PDF-файли
                    var fileItems = _record.ResearchFiles
                        .Where(f => f.ResearchId == null)
                        .Select(f => new ResearchSelectItem
                        {
                            Id = f.Id,
                            ResearchType = $"PDF: {System.IO.Path.GetFileName(f.FilePath)}",
                            StatusDisplay = "Очікує обробки",
                            IsFromFile = true,
                            FilePath = f.FilePath,
                            IsDisabled = false,
                            IsSelected = false
                        });

                    _allCaseResearches = caseResearchItems.Concat(unassignedResearchItems).Concat(fileItems).ToList();
                    ResearchTotalPages = Math.Max(1, (int)Math.Ceiling((double)_allCaseResearches.Count / _researchPageSize));
                    ResearchPage = 1;
                    UpdateResearchPage();

                    AvailableParentRecords = new ObservableCollection<RecordSelectItem>(
                        caseData.Records
                            .Where(r => r.IsSigned)
                            .Select(r => new RecordSelectItem
                            {
                                Id = r.Id,
                                DisplayName = $"{r.VisitDateDisplay} — {r.TypeDisplay} ({r.Author?.FullName ?? "—"})"
                            })
                    );
                }

                var allDoctors = await _doctorService.GetAllAsync();
                if (allDoctors != null)
                {
                    AvailableDoctors = new ObservableCollection<DoctorSelectItem>(
                        allDoctors
                            .Where(d => d.Id != SessionManager.DoctorId)
                            .Select(d => new DoctorSelectItem
                            {
                                Id = d.Id,
                                FullName = d.Person?.FullName ?? "—",
                                Specialization = d.Specialization
                            })
                    );
                }
            }
            catch { }
        }

        // --- Команди ---
        public void SelectCase(CaseDisplayModel caseModel)
        {
            SelectedCase = caseModel;
            CurrentStep = 2;
            ErrorMessage = string.Empty;
            _ = LoadCaseDataAsync();
        }

        public void GoBack()
        {
            CurrentStep = 1;
            ErrorMessage = string.Empty;
        }

        [RelayCommand]
        private void AddConsiliumDoctor()
        {
            if (SelectedConsiliumDoctor == null) return;
            if (ConsiliumDoctors.Any(d => d.DoctorId == SelectedConsiliumDoctor.Id))
            {
                ErrorMessage = "Цей лікар вже доданий";
                return;
            }
            ConsiliumDoctors.Add(new ConsiliumDoctorModel
            {
                DoctorId = SelectedConsiliumDoctor.Id,
                FullName = SelectedConsiliumDoctor.FullName,
                Specialization = SelectedConsiliumDoctor.Specialization,
                Role = string.IsNullOrWhiteSpace(ConsiliumDoctorRole) ? "Консультант" : ConsiliumDoctorRole
            });
            SelectedConsiliumDoctor = null;
            ConsiliumDoctorRole = "Консультант";
            ErrorMessage = string.Empty;
        }

        [RelayCommand]
        private void RemoveConsiliumDoctor(ConsiliumDoctorModel doctor) =>
            ConsiliumDoctors.Remove(doctor);

        [RelayCommand]
        private void AddMedication()
        {
            if (SelectedMedication == null) return;
            NewMedications.Add(new NewMedicationModel
            {
                MedicationId = SelectedMedication.Id,
                Name = SelectedMedication.DisplayName,
                DosageUnit = SelectedMedication.DosageUnit ?? string.Empty,
                Dosage = MedicationDosage,
                Frequency = MedicationFrequency,
                Duration = MedicationDuration,
                Comment = MedicationComment,
            });
            SelectedMedication = null;
            MedicationDosage = string.Empty;
            MedicationFrequency = string.Empty;
            MedicationDuration = string.Empty;
            MedicationComment = string.Empty;
            ErrorMessage = string.Empty;
        }

        [RelayCommand]
        private void RemoveMedication(NewMedicationModel medication) =>
            NewMedications.Remove(medication);

        [RelayCommand]
        private void AddAllergy()
        {
            if (SelectedAllergen == null) return;
            if (NewAllergies.Any(a => a.AllergenId == SelectedAllergen.Id))
            {
                ErrorMessage = "Ця алергія вже є в медкарті";
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
                },
                IsNew = true
            });
            SelectedAllergen = null;
            ErrorMessage = string.Empty;
        }

        [RelayCommand]
        private async void RemoveAllergy(EditAllergyModel allergy)
        {
            if (!allergy.IsNew)
            {
                try { await _patientAllergyService.RemoveAsync(_record.Id, allergy.AllergenId); }
                catch { }
            }
            NewAllergies.Remove(allergy);
        }

        [RelayCommand]
        private void AddDisease()
        {
            if (SelectedDisease == null) return;
            if (NewDiagnoses.Any(d => d.DiseaseId == SelectedDisease.Id))
            {
                ErrorMessage = "Цей діагноз вже є в медкарті";
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
                },
                IsNew = true
            });
            SelectedDisease = null;
            ErrorMessage = string.Empty;
        }

        [RelayCommand]
        private void RemoveDiagnosis(EditDiagnosisModel diagnosis)
        {
            if (!diagnosis.IsNew) return;
            NewDiagnoses.Remove(diagnosis);
        }

        [RelayCommand]
        private async Task SaveAsync()
        {
            if (SelectedCase == null)
            {
                ErrorMessage = "Оберіть кейс";
                CurrentStep = 1;
                return;
            }

            if (string.IsNullOrWhiteSpace(Complaints) && string.IsNullOrWhiteSpace(DoctorConclusion))
            {
                ErrorMessage = "Заповніть хоча б скарги або висновок лікаря";
                return;
            }

            var unprocessedSelected = _allCaseResearches
                .Where(r => r.IsSelected && r.IsFromFile)
                .ToList();

            if (unprocessedSelected.Any())
            {
                ErrorMessage = "Не можна прив'язати необроблені PDF-файли до запису. Спочатку обробіть їх через кнопку \"Обробити\".";
                foreach (var item in unprocessedSelected)
                    item.IsSelected = false;
                return;
            }

            try
            {
                IsSaving = true;
                ErrorMessage = string.Empty;

                var record = await _recordService.CreateAsync(new CreateRecordRequest
                {
                    MedicalRecordId = _record.Id,
                    CaseId = SelectedCase.Id,
                    AuthorId = SessionManager.DoctorId,
                    ParentRecordId = SelectedParentRecord?.Id,
                    VisitDate = DateTime.Today.ToString("yyyy-MM-dd"),
                    Type = SelectedRecordType,
                    Status = IsDraft ? "DRAFT" : "SIGNED",
                    Complaints = N(Complaints),
                    HistoryOfIllness = N(HistoryOfIllness),
                    HistoryOfLife = N(HistoryOfLife),
                    SocialHabits = N(SocialHabits),
                    GeneralCondition = N(GeneralCondition),
                    SkinStatus = N(SkinStatus),
                    RespiratorySystem = N(RespiratorySystem),
                    Cardiovascular = N(Cardiovascular),
                    DoctorConclusion = N(DoctorConclusion),
                    TreatmentPlan = N(TreatmentPlan),
                    Temperature = decimal.TryParse(Temperature, out var t) ? t : null,
                    BloodPressure = N(BloodPressure),
                    HeartRate = int.TryParse(HeartRate, out var hr) ? hr : null,
                    Spo2 = int.TryParse(Spo2, out var s) ? s : null,
                    Weight = decimal.TryParse(Weight, out var w) ? w : null,
                    Height = decimal.TryParse(Height, out var h) ? h : null,
                });

                if (record != null)
                {
                    if (IsConsilium)
                    {
                        foreach (var doc in ConsiliumDoctors)
                        {
                            try { await _recordDoctorService.AddAsync(record.Id, doc.DoctorId, doc.Role); }
                            catch { }
                        }
                    }

                    foreach (var med in NewMedications)
                    {
                        try
                        {
                            await _recordMedicationService.AddAsync(
                                record.Id, med.MedicationId,
                                N(med.Dosage), N(med.Frequency),
                                N(med.Duration), N(med.Comment));
                        }
                        catch { }
                    }

                    foreach (var research in _allCaseResearches.Where(r => r.IsSelected && !r.IsFromFile && !r.IsDisabled))
                    {
                        try { await _recordResearchService.AddAsync(record.Id, research.Id); }
                        catch { }
                    }

                    // Тільки нові алергії
                    foreach (var allergy in NewAllergies.Where(a => a.IsNew))
                    {
                        try
                        {
                            await _patientAllergyService.AddAsync(
                                _record.Id, allergy.AllergenId,
                                allergy.Severity, DateTime.Today);
                        }
                        catch { }
                    }

                    // Тільки нові діагнози
                    foreach (var diagnosis in NewDiagnoses.Where(d => d.IsNew))
                    {
                        try
                        {
                            await _patientDiseaseService.AddAsync(
                                _record.Id, diagnosis.DiseaseId,
                                diagnosis.Status, DateTime.Today);
                        }
                        catch { }
                    }

                    // Оновлення важкості існуючих алергій
                    foreach (var allergy in NewAllergies.Where(a => !a.IsNew))
                    {
                        try { await _patientAllergyService.UpdateSeverityAsync(_record.Id, allergy.AllergenId, allergy.Severity); }
                        catch { }
                    }

                    // Оновлення статусу існуючих діагнозів
                    foreach (var diagnosis in NewDiagnoses.Where(d => !d.IsNew))
                    {
                        try { await _patientDiseaseService.UpdateStatusAsync(_record.Id, diagnosis.DiseaseId, diagnosis.Status); }
                        catch { }
                    }
                }

                OnSaved?.Invoke();
            }
            catch (ApiException ex)
            {
                ErrorMessage = ex.Message;
            }
            catch (Exception ex)
            {
                ErrorMessage = $"Помилка: {ex.Message}";
            }
            finally
            {
                IsSaving = false;
            }
        }

        private static string? N(string s) =>
            string.IsNullOrWhiteSpace(s) ? null : s;
    }

    // --- Допоміжні моделі ---
    public class ConsiliumDoctorModel
    {
        public int DoctorId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Specialization { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
    }

    public class DoctorSelectItem
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Specialization { get; set; } = string.Empty;
        public string DisplayName => $"{FullName} — {Specialization}";
    }

    public class NewMedicationModel
    {
        public int MedicationId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string DosageUnit { get; set; } = string.Empty;
        public string Dosage { get; set; } = string.Empty;
        public string Frequency { get; set; } = string.Empty;
        public string Duration { get; set; } = string.Empty;
        public string Comment { get; set; } = string.Empty;
        public string Summary => $"{Dosage} {DosageUnit} · {Frequency} · {Duration}".Trim(' ', '·');
    }

    public class ResearchSelectItem : ObservableObject
    {
        public int Id { get; set; }
        public string ResearchType { get; set; } = string.Empty;
        public string StatusDisplay { get; set; } = string.Empty;
        public bool IsFromFile { get; set; }
        public string? FilePath { get; set; }
        public bool IsDisabled { get; set; }

        private bool _isSelected;
        public bool IsSelected
        {
            get => _isSelected;
            set => SetProperty(ref _isSelected, value);
        }
    }

    public class RecordSelectItem
    {
        public int Id { get; set; }
        public string DisplayName { get; set; } = string.Empty;
    }
}