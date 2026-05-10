using System.Windows;
using System.Windows.Controls;
using MedicalApp.Services;
using MedicalApp.ViewModels;

namespace MedicalApp.Views;

public partial class NewRecordWindow : Window
{
    private readonly NewRecordViewModel _vm;



    public NewRecordWindow(PatientDisplayModel patient, FullMedicalRecordResponse record, CaseDisplayModel? preselectedCase)
    {
        InitializeComponent();
        _vm = new NewRecordViewModel(patient, record, preselectedCase);
        _vm.OnSaved = () =>
        {
            DialogResult = true;
            Close();
        };
        DataContext = _vm;
        Loaded += (s, e) =>
        {
            var typeCombo = FindName("RecordTypeCombo") as ComboBox;
            if (typeCombo != null) typeCombo.SelectedIndex = 0;
        };
    }

    private void ResearchPrevPage_Click(object sender, RoutedEventArgs e)
    => _vm.ResearchPrevPageCommand.Execute(null);

    private void ResearchNextPage_Click(object sender, RoutedEventArgs e)
        => _vm.ResearchNextPageCommand.Execute(null);

    private async void ProcessResearchFromRecord_Click(object sender, RoutedEventArgs e)
    {
        if (sender is not Button btn || btn.Tag is not ResearchSelectItem item)
            return;

        var research = new ResearchDisplayModel
        {
            Id = item.Id,
            ResearchType = item.ResearchType,
            StatusDisplay = item.StatusDisplay,
            IsFromFile = true,
            FileId = item.Id,
            FilePath = item.FilePath,
            StatusColor = "#FAEEDA",
            StatusTextColor = "#854F0B",
            CreatedAt = DateTime.Today,
            Status = "PENDING"
        };

        var window = new ProcessResearchWindow(
            research,
            _vm.Patient.FullName,
            _vm.Cases.ToList(),
            _vm.Record.Id
        );
        window.Owner = this;
        if (window.ShowDialog() == true)
        {
            // Оновлюємо список — файл тепер оброблений
            await _vm.ReloadResearchesAsync();
        }
    }

    private void ToggleMedications_Click(object sender, RoutedEventArgs e)
   => _vm.IsMedicationsExpanded = !_vm.IsMedicationsExpanded;

    private void ToggleExamStatus_Click(object sender, RoutedEventArgs e)
        => _vm.IsExamStatusExpanded = !_vm.IsExamStatusExpanded;

    private void ToggleResearches_Click(object sender, RoutedEventArgs e)
        => _vm.IsResearchesExpanded = !_vm.IsResearchesExpanded;

    private void CancelOrBackButton_Click(object sender, RoutedEventArgs e)
    {
        if (_vm.IsStep2)
            _vm.GoBack();
        else
        {
            DialogResult = false;
            Close();
        }
    }

    private void SelectCase_Click(object sender, RoutedEventArgs e)
    {
        if (sender is Button btn && btn.Tag is CaseDisplayModel caseModel)
            _vm.SelectCase(caseModel);
    }

    private void ToggleAnamnesis_Click(object sender, RoutedEventArgs e)
        => _vm.IsAnamnesisExpanded = !_vm.IsAnamnesisExpanded;

    private void ToggleVitals_Click(object sender, RoutedEventArgs e)
        => _vm.IsVitalsExpanded = !_vm.IsVitalsExpanded;

    private void ToggleAllergies_Click(object sender, RoutedEventArgs e)
        => _vm.IsAllergiesExpanded = !_vm.IsAllergiesExpanded;

    private void ToggleDiagnoses_Click(object sender, RoutedEventArgs e)
        => _vm.IsDiagnosesExpanded = !_vm.IsDiagnosesExpanded;

    private void RecordType_SelectionChanged(object sender, SelectionChangedEventArgs e)
    {
        if (sender is ComboBox cb && cb.SelectedIndex >= 0)
            _vm.SelectedRecordType = _vm.RecordTypeOptions[cb.SelectedIndex];
    }

    private void AllergySeverity_SelectionChanged(object sender, SelectionChangedEventArgs e)
    {
        if (sender is not ComboBox cb || cb.SelectedIndex < 0) return;

        // Якщо це ComboBox у рядку списку — DataContext є EditAllergyModel
        if (cb.DataContext is EditAllergyModel allergy)
        {
            allergy.Severity = _vm.SeverityOptions[cb.SelectedIndex];
            allergy.SeverityDisplay = _vm.SeverityDisplayOptions[cb.SelectedIndex];
            allergy.SeverityColor = cb.SelectedIndex switch { 2 => "#FCEBEB", 1 => "#FAEEDA", _ => "#EAF3DE" };
            allergy.SeverityTextColor = cb.SelectedIndex switch { 2 => "#A32D2D", 1 => "#854F0B", _ => "#3B6D11" };
            return;
        }

        // Інакше — це форма додавання, оновлюємо ViewModel
        _vm.SelectedNewAllergySeverity = _vm.SeverityOptions[cb.SelectedIndex];
    }

    private void DiagnosisStatus_SelectionChanged(object sender, SelectionChangedEventArgs e)
    {
        if (sender is not ComboBox cb || cb.SelectedIndex < 0) return;

        if (cb.DataContext is EditDiagnosisModel diagnosis)
        {
            diagnosis.Status = _vm.DiseaseStatusOptions[cb.SelectedIndex];
            diagnosis.StatusDisplay = _vm.DiseaseStatusDisplayOptions[cb.SelectedIndex];
            diagnosis.StatusColor = cb.SelectedIndex switch { 0 => "#FCEBEB", 1 => "#FAEEDA", _ => "#EAF3DE" };
            diagnosis.StatusTextColor = cb.SelectedIndex switch { 0 => "#A32D2D", 1 => "#854F0B", _ => "#3B6D11" };
            return;
        }

        _vm.SelectedNewDiseaseStatus = _vm.DiseaseStatusOptions[cb.SelectedIndex];
    }

    private void NewDiseaseStatus_SelectionChanged(object sender, SelectionChangedEventArgs e)
    {
        if (sender is ComboBox cb && cb.SelectedIndex >= 0)
            _vm.SelectedNewDiseaseStatus = _vm.DiseaseStatusOptions[cb.SelectedIndex];
    }

    private void NewCaseFromRecord_Click(object sender, RoutedEventArgs e)
    {
        var window = new NewCaseWindow(_vm.Patient, _vm.Record);
        window.Owner = this;
        if (window.ShowDialog() == true && window.CreatedCase != null)
        {
            _vm.AddCase(window.CreatedCase);
        }
    }

    private void ViewResearchFromRecord_Click(object sender, RoutedEventArgs e)
    {
        if (sender is not Button btn || btn.Tag is not ResearchSelectItem item)
            return;

        // Конвертуємо в ResearchDisplayModel для ViewResearchWindow
        var research = new ResearchDisplayModel
        {
            Id = item.Id,
            ResearchType = item.ResearchType,
            StatusDisplay = item.StatusDisplay,
            IsFromFile = item.IsFromFile,
            FilePath = item.FilePath,
            StatusColor = item.IsFromFile ? "#FAEEDA" : "#EAF3DE",
            StatusTextColor = item.IsFromFile ? "#854F0B" : "#3B6D11",
            CreatedAt = DateTime.Today,
            Status = item.IsFromFile ? "PENDING" : "PROCESSED"
        };

        var window = new ViewResearchWindow(
            research,
            _vm.Patient.FullName,
            _vm.Cases.ToList(),
            _vm.Record.Id
        );
        window.Owner = this;
        window.ShowDialog();
    }


}