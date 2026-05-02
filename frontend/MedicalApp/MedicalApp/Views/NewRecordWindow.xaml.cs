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
        if (sender is ComboBox cb && cb.SelectedIndex >= 0)
            _vm.SelectedNewAllergySeverity = _vm.SeverityOptions[cb.SelectedIndex];
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
}