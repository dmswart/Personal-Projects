namespace globemaker
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
            this.groupboxInput = new System.Windows.Forms.GroupBox();
            this.buttonEditSkeleton = new System.Windows.Forms.Button();
            this.labelSkeleton = new System.Windows.Forms.Label();
            this.textBoxSkeleton = new System.Windows.Forms.TextBox();
            this.buttonBrowseSkeleton = new System.Windows.Forms.Button();
            this.labelSource = new System.Windows.Forms.Label();
            this.textBoxSource = new System.Windows.Forms.TextBox();
            this.checkBoxMirroBall = new System.Windows.Forms.CheckBox();
            this.buttonBrowseSource = new System.Windows.Forms.Button();
            this.panelPreview = new System.Windows.Forms.Panel();
            this.buttonPreview = new System.Windows.Forms.Button();
            this.groupboxOutput = new System.Windows.Forms.GroupBox();
            this.textBoxOutputSize = new System.Windows.Forms.TextBox();
            this.trackBarScale = new System.Windows.Forms.TrackBar();
            this.labelScale = new System.Windows.Forms.Label();
            this.buttonGo = new System.Windows.Forms.Button();
            this.backgroundWorker1 = new System.ComponentModel.BackgroundWorker();
            this.progressBar1 = new System.Windows.Forms.ProgressBar();
            this.buttonReset = new System.Windows.Forms.Button();
            this.buttonAutoCrop = new System.Windows.Forms.Button();
            this.timer1 = new System.Windows.Forms.Timer(this.components);
            this.tableLayoutPanel1 = new System.Windows.Forms.TableLayoutPanel();
            this.buttonSideView = new System.Windows.Forms.Button();
            this.buttonAngledView = new System.Windows.Forms.Button();
            this.buttonTopView = new System.Windows.Forms.Button();
            this.buttonFrontView = new System.Windows.Forms.Button();
            this.groupboxInput.SuspendLayout();
            this.groupboxOutput.SuspendLayout();
            ((System.ComponentModel.ISupportInitialize)(this.trackBarScale)).BeginInit();
            this.tableLayoutPanel1.SuspendLayout();
            this.SuspendLayout();
            // 
            // groupboxInput
            // 
            this.groupboxInput.Controls.Add(this.buttonEditSkeleton);
            this.groupboxInput.Controls.Add(this.labelSkeleton);
            this.groupboxInput.Controls.Add(this.textBoxSkeleton);
            this.groupboxInput.Controls.Add(this.buttonBrowseSkeleton);
            this.groupboxInput.Controls.Add(this.labelSource);
            this.groupboxInput.Controls.Add(this.textBoxSource);
            this.groupboxInput.Controls.Add(this.checkBoxMirroBall);
            this.groupboxInput.Controls.Add(this.buttonBrowseSource);
            this.groupboxInput.Location = new System.Drawing.Point(9, 10);
            this.groupboxInput.Margin = new System.Windows.Forms.Padding(2);
            this.groupboxInput.Name = "groupboxInput";
            this.groupboxInput.Padding = new System.Windows.Forms.Padding(2);
            this.groupboxInput.Size = new System.Drawing.Size(598, 84);
            this.groupboxInput.TabIndex = 0;
            this.groupboxInput.TabStop = false;
            this.groupboxInput.Text = "Input";
            // 
            // buttonEditSkeleton
            // 
            this.buttonEditSkeleton.Location = new System.Drawing.Point(509, 49);
            this.buttonEditSkeleton.Margin = new System.Windows.Forms.Padding(2);
            this.buttonEditSkeleton.Name = "buttonEditSkeleton";
            this.buttonEditSkeleton.Size = new System.Drawing.Size(81, 19);
            this.buttonEditSkeleton.TabIndex = 7;
            this.buttonEditSkeleton.Text = "Edit";
            this.buttonEditSkeleton.UseVisualStyleBackColor = true;
            this.buttonEditSkeleton.Click += new System.EventHandler(this.buttonEditSkeleton_Click);
            // 
            // labelSkeleton
            // 
            this.labelSkeleton.AutoSize = true;
            this.labelSkeleton.Location = new System.Drawing.Point(23, 52);
            this.labelSkeleton.Margin = new System.Windows.Forms.Padding(2, 0, 2, 0);
            this.labelSkeleton.Name = "labelSkeleton";
            this.labelSkeleton.Size = new System.Drawing.Size(49, 13);
            this.labelSkeleton.TabIndex = 6;
            this.labelSkeleton.Text = "Skeleton";
            // 
            // textBoxSkeleton
            // 
            this.textBoxSkeleton.Location = new System.Drawing.Point(75, 50);
            this.textBoxSkeleton.Margin = new System.Windows.Forms.Padding(2);
            this.textBoxSkeleton.Name = "textBoxSkeleton";
            this.textBoxSkeleton.Size = new System.Drawing.Size(399, 20);
            this.textBoxSkeleton.TabIndex = 5;
            // 
            // buttonBrowseSkeleton
            // 
            this.buttonBrowseSkeleton.Location = new System.Drawing.Point(478, 49);
            this.buttonBrowseSkeleton.Margin = new System.Windows.Forms.Padding(2);
            this.buttonBrowseSkeleton.Name = "buttonBrowseSkeleton";
            this.buttonBrowseSkeleton.Size = new System.Drawing.Size(25, 19);
            this.buttonBrowseSkeleton.TabIndex = 4;
            this.buttonBrowseSkeleton.Text = "...";
            this.buttonBrowseSkeleton.UseVisualStyleBackColor = true;
            this.buttonBrowseSkeleton.Click += new System.EventHandler(this.buttonBrowseSkeleton_Click);
            // 
            // labelSource
            // 
            this.labelSource.AutoSize = true;
            this.labelSource.Location = new System.Drawing.Point(23, 17);
            this.labelSource.Margin = new System.Windows.Forms.Padding(2, 0, 2, 0);
            this.labelSource.Name = "labelSource";
            this.labelSource.Size = new System.Drawing.Size(41, 13);
            this.labelSource.TabIndex = 3;
            this.labelSource.Text = "Source";
            // 
            // textBoxSource
            // 
            this.textBoxSource.Location = new System.Drawing.Point(75, 15);
            this.textBoxSource.Margin = new System.Windows.Forms.Padding(2);
            this.textBoxSource.Name = "textBoxSource";
            this.textBoxSource.Size = new System.Drawing.Size(399, 20);
            this.textBoxSource.TabIndex = 2;
            // 
            // checkBoxMirroBall
            // 
            this.checkBoxMirroBall.AutoSize = true;
            this.checkBoxMirroBall.Location = new System.Drawing.Point(507, 16);
            this.checkBoxMirroBall.Margin = new System.Windows.Forms.Padding(2);
            this.checkBoxMirroBall.Name = "checkBoxMirroBall";
            this.checkBoxMirroBall.Size = new System.Drawing.Size(83, 17);
            this.checkBoxMirroBall.TabIndex = 1;
            this.checkBoxMirroBall.Text = "Is Mirror Ball";
            this.checkBoxMirroBall.UseVisualStyleBackColor = true;
            // 
            // buttonBrowseSource
            // 
            this.buttonBrowseSource.Location = new System.Drawing.Point(478, 15);
            this.buttonBrowseSource.Margin = new System.Windows.Forms.Padding(2);
            this.buttonBrowseSource.Name = "buttonBrowseSource";
            this.buttonBrowseSource.Size = new System.Drawing.Size(25, 19);
            this.buttonBrowseSource.TabIndex = 0;
            this.buttonBrowseSource.Text = "...";
            this.buttonBrowseSource.UseVisualStyleBackColor = true;
            this.buttonBrowseSource.Click += new System.EventHandler(this.buttonBrowseSource_Click);
            // 
            // panelPreview
            // 
            this.panelPreview.BackgroundImageLayout = System.Windows.Forms.ImageLayout.None;
            this.panelPreview.Location = new System.Drawing.Point(9, 100);
            this.panelPreview.Margin = new System.Windows.Forms.Padding(2);
            this.panelPreview.Name = "panelPreview";
            this.panelPreview.Size = new System.Drawing.Size(500, 500);
            this.panelPreview.TabIndex = 1;
            // 
            // buttonPreview
            // 
            this.buttonPreview.Location = new System.Drawing.Point(513, 100);
            this.buttonPreview.Margin = new System.Windows.Forms.Padding(2);
            this.buttonPreview.Name = "buttonPreview";
            this.buttonPreview.Size = new System.Drawing.Size(86, 19);
            this.buttonPreview.TabIndex = 2;
            this.buttonPreview.Text = "Preview";
            this.buttonPreview.UseVisualStyleBackColor = true;
            this.buttonPreview.Click += new System.EventHandler(this.buttonPreview_Click);
            // 
            // groupboxOutput
            // 
            this.groupboxOutput.Controls.Add(this.textBoxOutputSize);
            this.groupboxOutput.Controls.Add(this.trackBarScale);
            this.groupboxOutput.Controls.Add(this.labelScale);
            this.groupboxOutput.Controls.Add(this.buttonGo);
            this.groupboxOutput.Location = new System.Drawing.Point(6, 604);
            this.groupboxOutput.Margin = new System.Windows.Forms.Padding(2);
            this.groupboxOutput.Name = "groupboxOutput";
            this.groupboxOutput.Padding = new System.Windows.Forms.Padding(2);
            this.groupboxOutput.Size = new System.Drawing.Size(601, 84);
            this.groupboxOutput.TabIndex = 3;
            this.groupboxOutput.TabStop = false;
            this.groupboxOutput.Text = "Output";
            // 
            // textBoxOutputSize
            // 
            this.textBoxOutputSize.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
            this.textBoxOutputSize.Location = new System.Drawing.Point(26, 60);
            this.textBoxOutputSize.Margin = new System.Windows.Forms.Padding(2);
            this.textBoxOutputSize.Multiline = true;
            this.textBoxOutputSize.Name = "textBoxOutputSize";
            this.textBoxOutputSize.ReadOnly = true;
            this.textBoxOutputSize.Size = new System.Drawing.Size(480, 18);
            this.textBoxOutputSize.TabIndex = 13;
            // 
            // trackBarScale
            // 
            this.trackBarScale.LargeChange = 200;
            this.trackBarScale.Location = new System.Drawing.Point(75, 15);
            this.trackBarScale.Margin = new System.Windows.Forms.Padding(2);
            this.trackBarScale.Maximum = 4000;
            this.trackBarScale.Minimum = 50;
            this.trackBarScale.Name = "trackBarScale";
            this.trackBarScale.Size = new System.Drawing.Size(518, 45);
            this.trackBarScale.SmallChange = 50;
            this.trackBarScale.TabIndex = 12;
            this.trackBarScale.TickFrequency = 50;
            this.trackBarScale.Value = 50;
            this.trackBarScale.Scroll += new System.EventHandler(this.trackBarScale_Scroll);
            // 
            // labelScale
            // 
            this.labelScale.AutoSize = true;
            this.labelScale.Location = new System.Drawing.Point(23, 15);
            this.labelScale.Margin = new System.Windows.Forms.Padding(2, 0, 2, 0);
            this.labelScale.Name = "labelScale";
            this.labelScale.Size = new System.Drawing.Size(34, 13);
            this.labelScale.TabIndex = 11;
            this.labelScale.Text = "Scale";
            // 
            // buttonGo
            // 
            this.buttonGo.Location = new System.Drawing.Point(512, 59);
            this.buttonGo.Margin = new System.Windows.Forms.Padding(2);
            this.buttonGo.Name = "buttonGo";
            this.buttonGo.Size = new System.Drawing.Size(81, 19);
            this.buttonGo.TabIndex = 10;
            this.buttonGo.Text = "Go";
            this.buttonGo.UseVisualStyleBackColor = true;
            this.buttonGo.Click += new System.EventHandler(this.buttonGo_Click);
            // 
            // backgroundWorker1
            // 
            this.backgroundWorker1.DoWork += new System.ComponentModel.DoWorkEventHandler(this.backgroundWorker1_DoWork);
            this.backgroundWorker1.RunWorkerCompleted += new System.ComponentModel.RunWorkerCompletedEventHandler(this.backgroundWorker1_RunWorkerCompleted);
            // 
            // progressBar1
            // 
            this.progressBar1.Location = new System.Drawing.Point(6, 704);
            this.progressBar1.Margin = new System.Windows.Forms.Padding(2);
            this.progressBar1.Name = "progressBar1";
            this.progressBar1.Size = new System.Drawing.Size(601, 19);
            this.progressBar1.TabIndex = 4;
            // 
            // buttonReset
            // 
            this.buttonReset.Location = new System.Drawing.Point(513, 147);
            this.buttonReset.Margin = new System.Windows.Forms.Padding(2);
            this.buttonReset.Name = "buttonReset";
            this.buttonReset.Size = new System.Drawing.Size(86, 19);
            this.buttonReset.TabIndex = 5;
            this.buttonReset.Text = "Reset";
            this.buttonReset.UseVisualStyleBackColor = true;
            this.buttonReset.Click += new System.EventHandler(this.buttonReset_Click);
            // 
            // buttonAutoCrop
            // 
            this.buttonAutoCrop.Location = new System.Drawing.Point(513, 124);
            this.buttonAutoCrop.Margin = new System.Windows.Forms.Padding(2);
            this.buttonAutoCrop.Name = "buttonAutoCrop";
            this.buttonAutoCrop.Size = new System.Drawing.Size(86, 19);
            this.buttonAutoCrop.TabIndex = 6;
            this.buttonAutoCrop.Text = "Auto Crop";
            this.buttonAutoCrop.UseVisualStyleBackColor = true;
            this.buttonAutoCrop.Click += new System.EventHandler(this.buttonAutoCrop_Click);
            // 
            // timer1
            // 
            this.timer1.Interval = 200;
            this.timer1.Tick += new System.EventHandler(this.timer1_Tick);
            // 
            // tableLayoutPanel1
            // 
            this.tableLayoutPanel1.ColumnCount = 2;
            this.tableLayoutPanel1.ColumnStyles.Add(new System.Windows.Forms.ColumnStyle(System.Windows.Forms.SizeType.Percent, 50F));
            this.tableLayoutPanel1.ColumnStyles.Add(new System.Windows.Forms.ColumnStyle(System.Windows.Forms.SizeType.Percent, 50F));
            this.tableLayoutPanel1.Controls.Add(this.buttonSideView, 1, 1);
            this.tableLayoutPanel1.Controls.Add(this.buttonAngledView, 0, 1);
            this.tableLayoutPanel1.Controls.Add(this.buttonTopView, 1, 0);
            this.tableLayoutPanel1.Controls.Add(this.buttonFrontView, 0, 0);
            this.tableLayoutPanel1.Location = new System.Drawing.Point(513, 172);
            this.tableLayoutPanel1.Name = "tableLayoutPanel1";
            this.tableLayoutPanel1.RowCount = 2;
            this.tableLayoutPanel1.RowStyles.Add(new System.Windows.Forms.RowStyle(System.Windows.Forms.SizeType.Percent, 50F));
            this.tableLayoutPanel1.RowStyles.Add(new System.Windows.Forms.RowStyle(System.Windows.Forms.SizeType.Percent, 50F));
            this.tableLayoutPanel1.Size = new System.Drawing.Size(92, 88);
            this.tableLayoutPanel1.TabIndex = 7;
            // 
            // buttonSideView
            // 
            this.buttonSideView.Location = new System.Drawing.Point(49, 47);
            this.buttonSideView.Name = "buttonSideView";
            this.buttonSideView.Size = new System.Drawing.Size(37, 37);
            this.buttonSideView.TabIndex = 3;
            this.buttonSideView.Text = "Side";
            this.buttonSideView.UseVisualStyleBackColor = true;
            // 
            // buttonAngledView
            // 
            this.buttonAngledView.Location = new System.Drawing.Point(3, 47);
            this.buttonAngledView.Name = "buttonAngledView";
            this.buttonAngledView.Size = new System.Drawing.Size(40, 37);
            this.buttonAngledView.TabIndex = 2;
            this.buttonAngledView.Text = "3D";
            this.buttonAngledView.UseVisualStyleBackColor = true;
            this.buttonAngledView.Click += new System.EventHandler(this.buttonAngledView_Click);
            // 
            // buttonTopView
            // 
            this.buttonTopView.Location = new System.Drawing.Point(49, 3);
            this.buttonTopView.Name = "buttonTopView";
            this.buttonTopView.Size = new System.Drawing.Size(37, 37);
            this.buttonTopView.TabIndex = 1;
            this.buttonTopView.Text = "Top";
            this.buttonTopView.UseVisualStyleBackColor = true;
            // 
            // buttonFrontView
            // 
            this.buttonFrontView.Location = new System.Drawing.Point(3, 3);
            this.buttonFrontView.Name = "buttonFrontView";
            this.buttonFrontView.Size = new System.Drawing.Size(40, 37);
            this.buttonFrontView.TabIndex = 0;
            this.buttonFrontView.Text = "Front";
            this.buttonFrontView.UseVisualStyleBackColor = true;
            // 
            // Form1
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(617, 737);
            this.Controls.Add(this.tableLayoutPanel1);
            this.Controls.Add(this.buttonAutoCrop);
            this.Controls.Add(this.buttonReset);
            this.Controls.Add(this.progressBar1);
            this.Controls.Add(this.groupboxOutput);
            this.Controls.Add(this.buttonPreview);
            this.Controls.Add(this.panelPreview);
            this.Controls.Add(this.groupboxInput);
            this.Margin = new System.Windows.Forms.Padding(2);
            this.Name = "Form1";
            this.Text = "Globemaker#";
            this.groupboxInput.ResumeLayout(false);
            this.groupboxInput.PerformLayout();
            this.groupboxOutput.ResumeLayout(false);
            this.groupboxOutput.PerformLayout();
            ((System.ComponentModel.ISupportInitialize)(this.trackBarScale)).EndInit();
            this.tableLayoutPanel1.ResumeLayout(false);
            this.ResumeLayout(false);

        }

        #endregion

        private System.Windows.Forms.GroupBox groupboxInput;
        private System.Windows.Forms.CheckBox checkBoxMirroBall;
        private System.Windows.Forms.Button buttonBrowseSource;
        private System.Windows.Forms.Label labelSkeleton;
        private System.Windows.Forms.TextBox textBoxSkeleton;
        private System.Windows.Forms.Button buttonBrowseSkeleton;
        private System.Windows.Forms.Label labelSource;
        private System.Windows.Forms.TextBox textBoxSource;
        private System.Windows.Forms.Panel panelPreview;
        private System.Windows.Forms.Button buttonPreview;
        private System.Windows.Forms.GroupBox groupboxOutput;
        private System.Windows.Forms.Button buttonGo;
        private System.Windows.Forms.TrackBar trackBarScale;
        private System.Windows.Forms.Label labelScale;
        private System.ComponentModel.BackgroundWorker backgroundWorker1;
        private System.Windows.Forms.TextBox textBoxOutputSize;
        private System.Windows.Forms.ProgressBar progressBar1;
        private System.Windows.Forms.Button buttonReset;
        private System.Windows.Forms.Button buttonEditSkeleton;
        private System.Windows.Forms.Button buttonAutoCrop;
        private System.Windows.Forms.Timer timer1;
        private System.Windows.Forms.TableLayoutPanel tableLayoutPanel1;
        private System.Windows.Forms.Button buttonSideView;
        private System.Windows.Forms.Button buttonAngledView;
        private System.Windows.Forms.Button buttonTopView;
        private System.Windows.Forms.Button buttonFrontView;
    }
}

