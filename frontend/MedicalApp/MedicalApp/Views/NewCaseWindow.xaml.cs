using System.Windows;
using MedicalApp.Services;
using MedicalApp.ViewModels;

namespace MedicalApp.Views;

public partial class NewCaseWindow : Window
{
    private readonly NewCaseViewModel _vm;

    public CaseDisplayModel? CreatedCase { get; private set; }

    public NewCaseWindow(PatientDisplayModel patient, FullMedicalRecordResponse record)
    {
        InitializeComponent();
        _vm = new NewCaseViewModel(patient, record);
        _vm.OnSaved = (createdCase) =>
        {
            CreatedCase = new CaseDisplayModel
            {
                Id = createdCase.Id,
                MedicalRecordId = createdCase.MedicalRecordId,
                Status = createdCase.Status,
                StatusDisplay = "Відкритий",
                StatusColor = "#EAF3DE",
                StatusTextColor = "#3B6D11",
                OpeningDate = createdCase.OpeningDate,
                MainCondition = createdCase.MainCondition ?? "—",
                Description = createdCase.Description,
                RecordsCount = 0,
            };
            DialogResult = true;
            Close();
        };
        DataContext = _vm;
    }

    private void CancelButton_Click(object sender, RoutedEventArgs e)
    {
        DialogResult = false;
        Close();
    }
}