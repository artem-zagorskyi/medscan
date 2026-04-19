using System.Windows;
using System.Windows.Controls;
using MedicalApp.ViewModels;

namespace MedicalApp.Views;

public partial class PatientListView : UserControl
{
    public PatientListView()
    {
        InitializeComponent();
    }

    private void FilterButton_Click(object sender, RoutedEventArgs e)
    {
        FilterPopup.IsOpen = !FilterPopup.IsOpen;
    }

    private void GenderFilter_Click(object sender, RoutedEventArgs e)
    {
        if (sender is Button btn && btn.Tag is string gender)
            if (DataContext is PatientListViewModel vm)
                vm.SelectedGender = gender;
    }

    private void ResetFilters_Click(object sender, RoutedEventArgs e)
    {
        if (DataContext is PatientListViewModel vm)
            vm.ResetFilters();
        FilterPopup.IsOpen = false;
    }

    private void PageButton_Click(object sender, RoutedEventArgs e)
    {
        if (sender is Button btn && btn.Tag is int page)
            if (DataContext is PatientListViewModel vm)
                vm.GoToPageCommand.Execute(page);
    }

    private void OpenMedicalCard_Click(object sender, RoutedEventArgs e)
    {
        if (sender is Button btn && btn.Tag is PatientDisplayModel patient)
        {
            var mainWindow = (MainWindow)App.Current.MainWindow;
            mainWindow.NavigateTo(new MedicalCardView(patient));
        }
    }
}