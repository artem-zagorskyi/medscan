using CommunityToolkit.Mvvm.ComponentModel;
using MedicalApp.Services;
using MedicalApp.ViewModels;
using System.IO;
using System.Windows;

namespace MedicalApp.Views
{
    public partial class ViewResearchWindow : Window
    {
        private readonly ViewResearchViewModel _vm;
        private readonly List<CaseDisplayModel> _cases;
        private readonly int _medicalRecordId;
        private readonly ResearchFileService _researchFileService = new();

        public bool ShouldProcess { get; private set; } = false;

        public ViewResearchWindow(ResearchDisplayModel research, string patientName,
            List<CaseDisplayModel> cases, int medicalRecordId)
        {
            InitializeComponent();
            _cases = cases;
            _medicalRecordId = medicalRecordId;
            _vm = new ViewResearchViewModel(research, patientName);
            DataContext = _vm;

            if (research.IsFromFile)
                Loaded += OnLoaded;
        }

        private async void OnLoaded(object sender, RoutedEventArgs e)
        {
            await PdfViewer.EnsureCoreWebView2Async();

            var fileId = _vm.Research.FileId;
            if (fileId is null)
            {
                ShowNotFound();
                return;
            }

            try
            {
                var bytes = await _researchFileService.DownloadFileAsync(fileId.Value);

                var tempPath = Path.Combine(Path.GetTempPath(), $"medscan_{fileId.Value}.pdf");
                await File.WriteAllBytesAsync(tempPath, bytes);

                PdfViewer.Source = new Uri(tempPath);
            }
            catch
            {
                ShowNotFound();
            }
        }

        private void ShowNotFound()
        {
            PdfViewer.NavigateToString(@"
        <html><body style='font-family:sans-serif;display:flex;
            align-items:center;justify-content:center;height:100vh;margin:0;
            background:#525659;'>
            <div style='text-align:center'>
                <div style='font-size:48px'>📄</div>
                <div style='color:#ccc;margin-top:12px;font-size:14px'>Файл не знайдено</div>
            </div>
        </body></html>");
        }

        private void CloseButton_Click(object sender, RoutedEventArgs e)
        {
            Close();
        }

        private void ProcessButton_Click(object sender, RoutedEventArgs e)
        {
            // Закриваємо поточне вікно і відкриваємо ProcessResearchWindow
            Close();

            var processWindow = new ProcessResearchWindow(
                _vm.Research,
                _vm.PatientName,
                _cases,
                _medicalRecordId
            );
            processWindow.Owner = Owner;
            processWindow.ShowDialog();

            // Повідомляємо батьківський екран що треба оновитись
            ShouldProcess = processWindow.DialogResult == true;
        }
    }


}