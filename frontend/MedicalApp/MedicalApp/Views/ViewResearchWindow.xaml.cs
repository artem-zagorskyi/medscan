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

            var relativePath = _vm.FilePath?.Replace('/', '\\') ?? string.Empty;
            var basePath = AppDomain.CurrentDomain.BaseDirectory;
            var solutionRoot = Path.GetFullPath(Path.Combine(basePath, @"..\..\..\..\.."));
            var backendRoot = Path.GetFullPath(Path.Combine(solutionRoot, "..", "backend"));
            var fullPath = Path.GetFullPath(Path.Combine(backendRoot, relativePath));

            if (File.Exists(fullPath))
            {
                PdfViewer.Source = new Uri(fullPath);
            }
            else
            {
                PdfViewer.NavigateToString($@"
                    <html><body style='font-family:sans-serif;display:flex;
                        align-items:center;justify-content:center;height:100vh;margin:0;
                        background:#525659;'>
                        <div style='text-align:center'>
                            <div style='font-size:48px'>📄</div>
                            <div style='color:#ccc;margin-top:12px;font-size:14px'>Файл не знайдено</div>
                            <div style='color:#999;font-size:11px;margin-top:6px'>{fullPath}</div>
                        </div>
                    </body></html>");
            }
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