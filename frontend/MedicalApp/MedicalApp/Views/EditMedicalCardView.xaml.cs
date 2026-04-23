using System.Windows;
using System.Windows.Controls;
using MedicalApp.Services;
using MedicalApp.ViewModels;

namespace MedicalApp.Views;

public partial class EditMedicalCardView : UserControl
{
    private readonly EditMedicalCardViewModel _vm;

    public EditMedicalCardView(PatientDisplayModel patient, FullMedicalRecordResponse record)
    {
        InitializeComponent();
        _vm = new EditMedicalCardViewModel(patient, record);
        DataContext = _vm;
    }

    private void BackButton_Click(object sender, RoutedEventArgs e)
    {
        var mainWindow = (MainWindow)App.Current.MainWindow;
        mainWindow.NavigateTo(new MedicalCardView(_vm.Patient));
    }

    private void BloodGroupButton_Click(object sender, RoutedEventArgs e)
    {
        if (sender is Button btn && btn.Tag is string group)
            _vm.SelectedBloodGroup = group;
    }

    private void AllergySeverity_SelectionChanged(object sender, SelectionChangedEventArgs e)
    {
        if (sender is ComboBox cb && cb.SelectedIndex >= 0)
            _vm.SelectedNewAllergySeverity = _vm.SeverityOptions[cb.SelectedIndex];
    }

    private void DiseaseStatus_SelectionChanged(object sender, SelectionChangedEventArgs e)
    {
        if (sender is ComboBox cb && cb.Tag is EditDiagnosisModel diagnosis && cb.SelectedIndex >= 0)
        {
            diagnosis.Status = _vm.DiseaseStatusOptions[cb.SelectedIndex];
            _ = _vm.UpdateDiseaseStatusCommand.ExecuteAsync(diagnosis);
        }
    }

    private void NewDiseaseStatus_SelectionChanged(object sender, SelectionChangedEventArgs e)
    {
        if (sender is ComboBox cb && cb.SelectedIndex >= 0)
            _vm.SelectedNewDiseaseStatus = _vm.DiseaseStatusOptions[cb.SelectedIndex];
    }
}