namespace Stipple
{
    partial class Form1
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.components = new System.ComponentModel.Container();
            this.buttonSourceImage = new System.Windows.Forms.Button();
            this.textBoxSourceImage = new System.Windows.Forms.TextBox();
            this.LabelSourceImage = new System.Windows.Forms.Label();
            this.labelNumPoints = new System.Windows.Forms.Label();
            this.buttonYinYang = new System.Windows.Forms.Button();
            this.numericUpDownNumPoints = new System.Windows.Forms.NumericUpDown();
            this.buttonTSP = new System.Windows.Forms.Button();
            this.panel1 = new System.Windows.Forms.Panel();
            this.statusStrip1 = new System.Windows.Forms.StatusStrip();
            this.toolStripStatusLabel1 = new System.Windows.Forms.ToolStripStatusLabel();
            this.toolStripStatusLabel2 = new System.Windows.Forms.ToolStripStatusLabel();
            this.toolStripStatusLabel3 = new System.Windows.Forms.ToolStripStatusLabel();
            this.toolStripStatusLabel4 = new System.Windows.Forms.ToolStripStatusLabel();
            this.panel2 = new System.Windows.Forms.Panel();
            this.buttonHalt = new System.Windows.Forms.Button();
            this.checkBoxPath = new System.Windows.Forms.CheckBox();
            this.checkBoxShowCircles = new System.Windows.Forms.CheckBox();
            this.buttonInitial = new System.Windows.Forms.Button();
            this.textBoxInitial = new System.Windows.Forms.TextBox();
            this.LabelInitial = new System.Windows.Forms.Label();
            this.backgroundWorkerYinYang = new System.ComponentModel.BackgroundWorker();
            this.timer1 = new System.Windows.Forms.Timer(this.components);
            this.backgroundWorkerTSP = new System.ComponentModel.BackgroundWorker();
            this.buttonDraw = new System.Windows.Forms.Button();
            ((System.ComponentModel.ISupportInitialize)(this.numericUpDownNumPoints)).BeginInit();
            this.statusStrip1.SuspendLayout();
            this.panel2.SuspendLayout();
            this.SuspendLayout();
            // 
            // buttonSourceImage
            // 
            this.buttonSourceImage.Location = new System.Drawing.Point(268, 15);
            this.buttonSourceImage.Name = "buttonSourceImage";
            this.buttonSourceImage.Size = new System.Drawing.Size(31, 23);
            this.buttonSourceImage.TabIndex = 1;
            this.buttonSourceImage.Text = "...";
            this.buttonSourceImage.UseVisualStyleBackColor = true;
            this.buttonSourceImage.Click += new System.EventHandler(this.buttonSourceImage_Click);
            // 
            // textBoxSourceImage
            // 
            this.textBoxSourceImage.Location = new System.Drawing.Point(75, 15);
            this.textBoxSourceImage.Name = "textBoxSourceImage";
            this.textBoxSourceImage.Size = new System.Drawing.Size(187, 22);
            this.textBoxSourceImage.TabIndex = 2;
            // 
            // LabelSourceImage
            // 
            this.LabelSourceImage.AutoSize = true;
            this.LabelSourceImage.Location = new System.Drawing.Point(16, 15);
            this.LabelSourceImage.Name = "LabelSourceImage";
            this.LabelSourceImage.Size = new System.Drawing.Size(53, 17);
            this.LabelSourceImage.TabIndex = 4;
            this.LabelSourceImage.Text = "Source";
            // 
            // labelNumPoints
            // 
            this.labelNumPoints.AutoSize = true;
            this.labelNumPoints.Location = new System.Drawing.Point(16, 77);
            this.labelNumPoints.Name = "labelNumPoints";
            this.labelNumPoints.Size = new System.Drawing.Size(59, 17);
            this.labelNumPoints.TabIndex = 5;
            this.labelNumPoints.Text = "# Points";
            // 
            // buttonYinYang
            // 
            this.buttonYinYang.Location = new System.Drawing.Point(305, 15);
            this.buttonYinYang.Name = "buttonYinYang";
            this.buttonYinYang.Size = new System.Drawing.Size(75, 23);
            this.buttonYinYang.TabIndex = 6;
            this.buttonYinYang.Text = "YinYang";
            this.buttonYinYang.UseVisualStyleBackColor = true;
            this.buttonYinYang.Click += new System.EventHandler(this.buttonGo_Click);
            // 
            // numericUpDownNumPoints
            // 
            this.numericUpDownNumPoints.ImeMode = System.Windows.Forms.ImeMode.Off;
            this.numericUpDownNumPoints.Location = new System.Drawing.Point(75, 77);
            this.numericUpDownNumPoints.Maximum = new decimal(new int[] {
            10000,
            0,
            0,
            0});
            this.numericUpDownNumPoints.Minimum = new decimal(new int[] {
            1,
            0,
            0,
            0});
            this.numericUpDownNumPoints.Name = "numericUpDownNumPoints";
            this.numericUpDownNumPoints.Size = new System.Drawing.Size(120, 22);
            this.numericUpDownNumPoints.TabIndex = 7;
            this.numericUpDownNumPoints.Value = new decimal(new int[] {
            100,
            0,
            0,
            0});
            // 
            // buttonTSP
            // 
            this.buttonTSP.Location = new System.Drawing.Point(305, 47);
            this.buttonTSP.Name = "buttonTSP";
            this.buttonTSP.Size = new System.Drawing.Size(75, 23);
            this.buttonTSP.TabIndex = 8;
            this.buttonTSP.Text = "TSP";
            this.buttonTSP.UseVisualStyleBackColor = true;
            this.buttonTSP.Click += new System.EventHandler(this.buttonTSP_Click);
            // 
            // panel1
            // 
            this.panel1.Dock = System.Windows.Forms.DockStyle.Fill;
            this.panel1.Location = new System.Drawing.Point(0, 117);
            this.panel1.Name = "panel1";
            this.panel1.Size = new System.Drawing.Size(594, 283);
            this.panel1.TabIndex = 9;
            this.panel1.Paint += new System.Windows.Forms.PaintEventHandler(this.panel1_Paint);
            // 
            // statusStrip1
            // 
            this.statusStrip1.Items.AddRange(new System.Windows.Forms.ToolStripItem[] {
            this.toolStripStatusLabel1,
            this.toolStripStatusLabel2,
            this.toolStripStatusLabel3,
            this.toolStripStatusLabel4});
            this.statusStrip1.Location = new System.Drawing.Point(0, 400);
            this.statusStrip1.Name = "statusStrip1";
            this.statusStrip1.Size = new System.Drawing.Size(594, 23);
            this.statusStrip1.TabIndex = 0;
            this.statusStrip1.Text = "statusStrip1";
            // 
            // toolStripStatusLabel1
            // 
            this.toolStripStatusLabel1.Name = "toolStripStatusLabel1";
            this.toolStripStatusLabel1.Size = new System.Drawing.Size(141, 18);
            this.toolStripStatusLabel1.Text = "toolStripStatusLabel1";
            // 
            // toolStripStatusLabel2
            // 
            this.toolStripStatusLabel2.Name = "toolStripStatusLabel2";
            this.toolStripStatusLabel2.Size = new System.Drawing.Size(141, 18);
            this.toolStripStatusLabel2.Text = "toolStripStatusLabel2";
            // 
            // toolStripStatusLabel3
            // 
            this.toolStripStatusLabel3.Name = "toolStripStatusLabel3";
            this.toolStripStatusLabel3.Size = new System.Drawing.Size(141, 18);
            this.toolStripStatusLabel3.Text = "toolStripStatusLabel3";
            // 
            // toolStripStatusLabel4
            // 
            this.toolStripStatusLabel4.Name = "toolStripStatusLabel4";
            this.toolStripStatusLabel4.Size = new System.Drawing.Size(141, 18);
            this.toolStripStatusLabel4.Text = "toolStripStatusLabel4";
            // 
            // panel2
            // 
            this.panel2.Controls.Add(this.buttonDraw);
            this.panel2.Controls.Add(this.buttonHalt);
            this.panel2.Controls.Add(this.checkBoxPath);
            this.panel2.Controls.Add(this.checkBoxShowCircles);
            this.panel2.Controls.Add(this.buttonInitial);
            this.panel2.Controls.Add(this.textBoxInitial);
            this.panel2.Controls.Add(this.LabelInitial);
            this.panel2.Controls.Add(this.LabelSourceImage);
            this.panel2.Controls.Add(this.labelNumPoints);
            this.panel2.Controls.Add(this.buttonSourceImage);
            this.panel2.Controls.Add(this.buttonYinYang);
            this.panel2.Controls.Add(this.buttonTSP);
            this.panel2.Controls.Add(this.textBoxSourceImage);
            this.panel2.Controls.Add(this.numericUpDownNumPoints);
            this.panel2.Dock = System.Windows.Forms.DockStyle.Top;
            this.panel2.Location = new System.Drawing.Point(0, 0);
            this.panel2.Name = "panel2";
            this.panel2.Size = new System.Drawing.Size(594, 117);
            this.panel2.TabIndex = 10;
            // 
            // buttonHalt
            // 
            this.buttonHalt.Location = new System.Drawing.Point(305, 77);
            this.buttonHalt.Name = "buttonHalt";
            this.buttonHalt.Size = new System.Drawing.Size(75, 23);
            this.buttonHalt.TabIndex = 14;
            this.buttonHalt.Text = "Halt";
            this.buttonHalt.UseVisualStyleBackColor = true;
            this.buttonHalt.Click += new System.EventHandler(this.buttonHalt_Click);
            // 
            // checkBoxPath
            // 
            this.checkBoxPath.AutoSize = true;
            this.checkBoxPath.Location = new System.Drawing.Point(411, 44);
            this.checkBoxPath.Name = "checkBoxPath";
            this.checkBoxPath.Size = new System.Drawing.Size(56, 21);
            this.checkBoxPath.TabIndex = 13;
            this.checkBoxPath.Text = "Path";
            this.checkBoxPath.UseVisualStyleBackColor = true;
            // 
            // checkBoxShowCircles
            // 
            this.checkBoxShowCircles.AutoSize = true;
            this.checkBoxShowCircles.Location = new System.Drawing.Point(411, 16);
            this.checkBoxShowCircles.Name = "checkBoxShowCircles";
            this.checkBoxShowCircles.Size = new System.Drawing.Size(69, 21);
            this.checkBoxShowCircles.TabIndex = 12;
            this.checkBoxShowCircles.Text = "Circles";
            this.checkBoxShowCircles.UseVisualStyleBackColor = true;
            // 
            // buttonInitial
            // 
            this.buttonInitial.Location = new System.Drawing.Point(268, 47);
            this.buttonInitial.Name = "buttonInitial";
            this.buttonInitial.Size = new System.Drawing.Size(31, 23);
            this.buttonInitial.TabIndex = 11;
            this.buttonInitial.Text = "...";
            this.buttonInitial.UseVisualStyleBackColor = true;
            this.buttonInitial.Click += new System.EventHandler(this.buttonInitial_Click);
            // 
            // textBoxInitial
            // 
            this.textBoxInitial.Location = new System.Drawing.Point(75, 48);
            this.textBoxInitial.Name = "textBoxInitial";
            this.textBoxInitial.Size = new System.Drawing.Size(187, 22);
            this.textBoxInitial.TabIndex = 10;
            // 
            // LabelInitial
            // 
            this.LabelInitial.AutoSize = true;
            this.LabelInitial.Location = new System.Drawing.Point(16, 50);
            this.LabelInitial.Name = "LabelInitial";
            this.LabelInitial.Size = new System.Drawing.Size(40, 17);
            this.LabelInitial.TabIndex = 9;
            this.LabelInitial.Text = "Initial";
            // 
            // backgroundWorkerYinYang
            // 
            this.backgroundWorkerYinYang.DoWork += new System.ComponentModel.DoWorkEventHandler(this.backgroundWorker1_DoWork);
            this.backgroundWorkerYinYang.RunWorkerCompleted += new System.ComponentModel.RunWorkerCompletedEventHandler(this.backgroundWorker1_RunWorkerCompleted);
            this.backgroundWorkerYinYang.ProgressChanged += new System.ComponentModel.ProgressChangedEventHandler(this.backgroundWorker1_ProgressChanged);
            // 
            // timer1
            // 
            this.timer1.Interval = 2000;
            this.timer1.Tick += new System.EventHandler(this.timer1_Tick);
            // 
            // backgroundWorkerTSP
            // 
            this.backgroundWorkerTSP.DoWork += new System.ComponentModel.DoWorkEventHandler(this.backgroundWorkerTSP_DoWork);
            this.backgroundWorkerTSP.RunWorkerCompleted += new System.ComponentModel.RunWorkerCompletedEventHandler(this.backgroundWorkerTSP_RunWorkerCompleted);
            this.backgroundWorkerTSP.ProgressChanged += new System.ComponentModel.ProgressChangedEventHandler(this.backgroundWorkerTSP_ProgressChanged);
            // 
            // buttonDraw
            // 
            this.buttonDraw.Location = new System.Drawing.Point(405, 77);
            this.buttonDraw.Name = "buttonDraw";
            this.buttonDraw.Size = new System.Drawing.Size(75, 23);
            this.buttonDraw.TabIndex = 15;
            this.buttonDraw.Text = "Draw";
            this.buttonDraw.UseVisualStyleBackColor = true;
            this.buttonDraw.Click += new System.EventHandler(this.buttonDraw_Click);
            // 
            // Form1
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(8F, 16F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(594, 423);
            this.Controls.Add(this.panel1);
            this.Controls.Add(this.panel2);
            this.Controls.Add(this.statusStrip1);
            this.Name = "Form1";
            this.Text = "Form1";
            ((System.ComponentModel.ISupportInitialize)(this.numericUpDownNumPoints)).EndInit();
            this.statusStrip1.ResumeLayout(false);
            this.statusStrip1.PerformLayout();
            this.panel2.ResumeLayout(false);
            this.panel2.PerformLayout();
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion

        private System.Windows.Forms.Button buttonSourceImage;
        private System.Windows.Forms.TextBox textBoxSourceImage;
        private System.Windows.Forms.Label LabelSourceImage;
        private System.Windows.Forms.Label labelNumPoints;
        private System.Windows.Forms.Button buttonYinYang;
        private System.Windows.Forms.NumericUpDown numericUpDownNumPoints;
        private System.Windows.Forms.Button buttonTSP;
        private System.Windows.Forms.Panel panel1;
        private System.Windows.Forms.Panel panel2;
        private System.ComponentModel.BackgroundWorker backgroundWorkerYinYang;
        private System.Windows.Forms.StatusStrip statusStrip1;
        private System.Windows.Forms.ToolStripStatusLabel toolStripStatusLabel1;
        private System.Windows.Forms.ToolStripStatusLabel toolStripStatusLabel2;
        private System.Windows.Forms.ToolStripStatusLabel toolStripStatusLabel3;
        private System.Windows.Forms.ToolStripStatusLabel toolStripStatusLabel4;
        private System.Windows.Forms.Timer timer1;
        private System.Windows.Forms.Button buttonInitial;
        private System.Windows.Forms.TextBox textBoxInitial;
        private System.Windows.Forms.Label LabelInitial;
        private System.Windows.Forms.Button buttonHalt;
        private System.Windows.Forms.CheckBox checkBoxPath;
        private System.Windows.Forms.CheckBox checkBoxShowCircles;
        private System.ComponentModel.BackgroundWorker backgroundWorkerTSP;
        private System.Windows.Forms.Button buttonDraw;

    }
}

