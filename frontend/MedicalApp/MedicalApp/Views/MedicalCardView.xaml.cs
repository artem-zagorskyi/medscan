using System.Windows;
using System.Windows.Controls;
using System.Windows.Controls.Primitives;
using System.Windows.Media;
using MedicalApp.Services;
using MedicalApp.ViewModels;

namespace MedicalApp.Views;

public partial class MedicalCardView : UserControl
{
    private readonly MedicalCardViewModel _vm;

    public MedicalCardView(PatientDisplayModel patient)
    {
        InitializeComponent();
        _vm = new MedicalCardViewModel(patient);
        DataContext = _vm;
        Loaded += OnLoaded;
    }

    private void OnLoaded(object sender, RoutedEventArgs e)
    {
        CasesPageButtons.ItemContainerGenerator.StatusChanged += OnCasesPageButtonsGenerated;
        ResearchPageButtons.ItemContainerGenerator.StatusChanged += OnResearchPageButtonsGenerated;
    }

    private void OnCasesPageButtonsGenerated(object? sender, EventArgs e)
    {
        if (CasesPageButtons.ItemContainerGenerator.Status == GeneratorStatus.ContainersGenerated)
            UpdatePageButtons(CasesPageButtons, _vm.CasesCurrentPage);
    }

    private void OnResearchPageButtonsGenerated(object? sender, EventArgs e)
    {
        if (ResearchPageButtons.ItemContainerGenerator.Status == GeneratorStatus.ContainersGenerated)
            UpdatePageButtons(ResearchPageButtons, _vm.ResearchCurrentPage);
    }

    // --- Навігація ---
    private void BackButton_Click(object sender, RoutedEventArgs e)
    {
        var mainWindow = (MainWindow)App.Current.MainWindow;
        mainWindow.NavigateTo(new PatientListView());
    }

    private void EditButton_Click(object sender, RoutedEventArgs e)
    {
        if (_vm.CurrentRecord != null)
        {
            var mainWindow = (MainWindow)App.Current.MainWindow;
            mainWindow.NavigateTo(new EditMedicalCardView(_vm.Patient, _vm.CurrentRecord));
        }
    }

    private void ViewRecord_Click(object sender, RoutedEventArgs e)
    {
        if (sender is not Button btn || btn.Tag is not MedicalRecordEntryModel entry) return;
        var caseModel = _vm.CurrentCases.FirstOrDefault(c => c.Records.Any(r => r.Id == entry.Id));
        if (caseModel == null || _vm.CurrentRecord == null) return;

        var window = new RecordWindow(_vm.Patient, _vm.CurrentRecord, entry, caseModel, false);
        window.Owner = App.Current.MainWindow;
        window.ShowDialog();
        Reload();
    }

    private void EditRecord_Click(object sender, RoutedEventArgs e)
    {
        if (sender is not Button btn || btn.Tag is not MedicalRecordEntryModel entry) return;
        var caseModel = _vm.CurrentCases.FirstOrDefault(c => c.Records.Any(r => r.Id == entry.Id));
        if (caseModel == null || _vm.CurrentRecord == null) return;

        var window = new RecordWindow(_vm.Patient, _vm.CurrentRecord, entry, caseModel, true);
        window.Owner = App.Current.MainWindow;
        window.ShowDialog();
        Reload();
    }

    private void NewRecordButton_Click(object sender, RoutedEventArgs e)
    {
        if (_vm.CurrentRecord != null)
        {
            var window = new NewRecordWindow(_vm.Patient, _vm.CurrentRecord, null);
            window.Owner = App.Current.MainWindow;
            window.ShowDialog();
            Reload();
        }
    }

    // --- Вкладки ---
    private void RecordsTab_Click(object sender, RoutedEventArgs e) => _vm.ActiveTab = 0;
    private void ResearchTab_Click(object sender, RoutedEventArgs e) => _vm.ActiveTab = 1;

    // --- Кейси ---
    private void ToggleCase_Click(object sender, RoutedEventArgs e)
    {
        if (sender is Button btn && btn.Tag is CaseDisplayModel caseModel)
            caseModel.IsExpanded = !caseModel.IsExpanded;
    }

    private void NewCaseButton_Click(object sender, RoutedEventArgs e)
    {
        if (_vm.CurrentRecord != null)
        {
            var window = new NewCaseWindow(_vm.Patient, _vm.CurrentRecord);
            window.Owner = App.Current.MainWindow;
            if (window.ShowDialog() == true)
                Reload();
        }
    }

    private async void CloseCase_Click(object sender, RoutedEventArgs e)
    {
        if (sender is not Button btn || btn.Tag is not CaseDisplayModel caseModel) return;

        // Перевірка на чернетки
        var hasDrafts = caseModel.Records.Any(r => !r.IsSigned);
        if (hasDrafts)
        {
            MessageBox.Show(
                "Неможливо закрити кейс — є незбережені чернетки записів.\nСпочатку підпишіть або видаліть чернетки.",
                "Закриття кейсу",
                MessageBoxButton.OK,
                MessageBoxImage.Warning);
            return;
        }

        var result = MessageBox.Show(
            $"Закрити кейс \"{caseModel.MainCondition}\"?\nПісля закриття додавання записів буде неможливим.",
            "Підтвердження",
            MessageBoxButton.YesNo,
            MessageBoxImage.Question);

        if (result != MessageBoxResult.Yes) return;

        try
        {
            await _vm.CloseCaseAsync(caseModel);
        }
        catch (Exception ex)
        {
            MessageBox.Show($"Помилка: {ex.Message}", "Помилка", MessageBoxButton.OK, MessageBoxImage.Error);
        }
    }

    private void NewRecordInCase_Click(object sender, RoutedEventArgs e)
    {
        if (sender is Button btn && btn.Tag is CaseDisplayModel caseModel
            && _vm.CurrentRecord != null)
        {
            var window = new NewRecordWindow(_vm.Patient, _vm.CurrentRecord, caseModel);
            window.Owner = App.Current.MainWindow;
            window.ShowDialog();
            Reload();
        }
    }

    // --- Фільтри кейсів ---
    private void CaseFilterButton_Click(object sender, RoutedEventArgs e)
        => CaseFilterPopup.IsOpen = !CaseFilterPopup.IsOpen;

    private void ResetCaseFilter_Click(object sender, RoutedEventArgs e)
    {
        _vm.ResetCasesFilter();
        CaseFilterPopup.IsOpen = false;
    }

    // --- Фільтри досліджень ---
    private void ResearchFilterButton_Click(object sender, RoutedEventArgs e)
        => ResearchFilterPopup.IsOpen = !ResearchFilterPopup.IsOpen;

    private void ResetResearchFilter_Click(object sender, RoutedEventArgs e)
    {
        _vm.ResetResearchFilters();
        ResearchFilterPopup.IsOpen = false;
    }

    // --- Деталі запису ---
    private void ToggleEntryDetails_Click(object sender, RoutedEventArgs e)
    {
        if (sender is Button btn && btn.Tag is MedicalRecordEntryModel entry)
            entry.IsExpanded = !entry.IsExpanded;
    }

    // --- Обробка дослідження ---
    private async void ProcessResearch_Click(object sender, RoutedEventArgs e)
    {
        if (sender is not Button btn || btn.Tag is not ResearchDisplayModel research)
            return;

        var vm = (MedicalCardViewModel)DataContext;

        var window = new ProcessResearchWindow(
            research,
            vm.Patient.FullName,
            vm._allCases,
            vm.Patient.MedicalRecordId
        );
        window.Owner = Window.GetWindow(this);

        var result = window.ShowDialog();
        if (result == true)
        {
            // Перезавантажуємо медкарту щоб оновити список
            await vm.ReloadAsync();
        }
    }

    // --- Пагінація кейсів ---
    private void CasesPrevPage_Click(object sender, RoutedEventArgs e)
    {
        _vm.CasesPrevPageCommand.Execute(null);
        RefreshPageButtons(CasesPageButtons, _vm.CasesCurrentPage);
    }

    private void CasesNextPage_Click(object sender, RoutedEventArgs e)
    {
        _vm.CasesNextPageCommand.Execute(null);
        RefreshPageButtons(CasesPageButtons, _vm.CasesCurrentPage);
    }

    private void CasesPageButton_Click(object sender, RoutedEventArgs e)
    {
        if (sender is not Button btn || btn.Tag is not int page) return;
        _vm.GoToCasesPageCommand.Execute(page);
        UpdatePageButtons(CasesPageButtons, page);
    }

    // --- Пагінація досліджень ---
    private void ResearchPrevPage_Click(object sender, RoutedEventArgs e)
    {
        _vm.ResearchPrevPageCommand.Execute(null);
        RefreshPageButtons(ResearchPageButtons, _vm.ResearchCurrentPage);
    }

    private void ResearchNextPage_Click(object sender, RoutedEventArgs e)
    {
        _vm.ResearchNextPageCommand.Execute(null);
        RefreshPageButtons(ResearchPageButtons, _vm.ResearchCurrentPage);
    }

    private void ResearchPageButton_Click(object sender, RoutedEventArgs e)
    {
        if (sender is not Button btn || btn.Tag is not int page) return;
        _vm.GoToResearchPageCommand.Execute(page);
        UpdatePageButtons(ResearchPageButtons, page);
    }

    // --- Helpers ---
    private void RefreshPageButtons(ItemsControl control, int currentPage)
    {
        Dispatcher.InvokeAsync(() => UpdatePageButtons(control, currentPage),
            System.Windows.Threading.DispatcherPriority.Loaded);
    }

    private void UpdatePageButtons(ItemsControl control, int currentPage)
    {
        if (control == null) return;

        var active = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#185FA5"));
        var activeBg = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#E6F1FB"));
        var inactive = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#D3D1C7"));
        var inactiveBg = new SolidColorBrush(Colors.White);
        var inactiveFg = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#2C2C2A"));

        foreach (var item in control.Items)
        {
            var container = control.ItemContainerGenerator
                .ContainerFromItem(item) as ContentPresenter;
            if (container == null) continue;

            var btn = FindVisualChild<Button>(container);
            if (btn == null) continue;

            bool isActive = btn.Tag is int tag && tag == currentPage;
            btn.Background = isActive ? activeBg : inactiveBg;
            btn.BorderBrush = isActive ? active : inactive;
            btn.Foreground = isActive ? active : inactiveFg;
            btn.FontWeight = isActive ? FontWeights.SemiBold : FontWeights.Normal;
        }
    }

    private void Reload()
    {
        var mainWindow = (MainWindow)App.Current.MainWindow;
        mainWindow.NavigateTo(new MedicalCardView(_vm.Patient));
    }

    private static T? FindVisualChild<T>(DependencyObject parent) where T : DependencyObject
    {
        for (int i = 0; i < VisualTreeHelper.GetChildrenCount(parent); i++)
        {
            var child = VisualTreeHelper.GetChild(parent, i);
            if (child is T result) return result;
            var found = FindVisualChild<T>(child);
            if (found != null) return found;
        }
        return null;
    }

    private async void ViewResearch_Click(object sender, RoutedEventArgs e)
    {
        if (sender is not Button btn || btn.Tag is not ResearchDisplayModel research)
            return;

        var vm = (MedicalCardViewModel)DataContext;

        var window = new ViewResearchWindow(
            research,
            vm.Patient.FullName,
            vm._allCases,
            vm.Patient.MedicalRecordId
        );
        window.Owner = Window.GetWindow(this);
        window.ShowDialog();

        if (window.ShouldProcess)
            await vm.ReloadAsync();
    }

    private void ViewCaseResearch_Click(object sender, RoutedEventArgs e)
    {
        if (sender is not Button btn || btn.Tag is not ResearchResponse research)
            return;

        var vm = (MedicalCardViewModel)DataContext;

        var researchDisplay = new ResearchDisplayModel
        {
            Id = research.Id,
            ResearchType = research.ResearchType,
            StatusDisplay = research.StatusDisplay,
            IsFromFile = false,
            StatusColor = "#EAF3DE",
            StatusTextColor = "#3B6D11",
            CreatedAt = research.CreatedAt,
            Status = research.Status,
            Results = research.Results,
            ProcessedAt = research.ProcessedAt
        };

        var window = new ViewResearchWindow(
            researchDisplay,
            vm.Patient.FullName,
            vm._allCases,
            vm.Patient.MedicalRecordId
        );
        window.Owner = Window.GetWindow(this);
        window.ShowDialog();
    }

    private void ViewRecordResearch_Click(object sender, RoutedEventArgs e)
    {
        if (sender is not Button btn || btn.Tag is not RecordResearchResponse rr)
            return;

        if (rr.Research == null) return;

        var vm = (MedicalCardViewModel)DataContext;

        var research = new ResearchDisplayModel
        {
            Id = rr.Research.Id,
            ResearchType = rr.Research.ResearchType,
            StatusDisplay = rr.Research.StatusDisplay,
            IsFromFile = false,
            StatusColor = "#EAF3DE",
            StatusTextColor = "#3B6D11",
            CreatedAt = rr.Research.CreatedAt,
            Status = rr.Research.Status,
            Results = rr.Research.Results,
            ProcessedAt = rr.Research.ProcessedAt
        };

        var window = new ViewResearchWindow(
            research,
            vm.Patient.FullName,
            vm._allCases,
            vm.Patient.MedicalRecordId
        );
        window.Owner = Window.GetWindow(this);
        window.ShowDialog();
    }

    private async void ReopenCase_Click(object sender, RoutedEventArgs e)
    {
        if (sender is not Button btn || btn.Tag is not CaseDisplayModel caseModel)
            return;

        var vm = (MedicalCardViewModel)DataContext;
        await vm.ReopenCaseAsync(caseModel);
        await vm.ReloadAsync();
    }
}