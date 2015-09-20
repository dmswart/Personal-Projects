namespace RenderNets
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
            this.TextBoxNet = new System.Windows.Forms.TextBox();
            this.TextBoxSource = new System.Windows.Forms.TextBox();
            this.ButtonNet = new System.Windows.Forms.Button();
            this.ButtonSource = new System.Windows.Forms.Button();
            this.ButtonGo = new System.Windows.Forms.Button();
            this.RadioDefault = new System.Windows.Forms.RadioButton();
            this.RadioStereographic = new System.Windows.Forms.RadioButton();
            this.checkTriangular = new System.Windows.Forms.CheckBox();
            this.radioLagrange = new System.Windows.Forms.RadioButton();
            this.SuspendLayout();
            // 
            // TextBoxNet
            // 
            this.TextBoxNet.Location = new System.Drawing.Point(0, 10);
            this.TextBoxNet.Margin = new System.Windows.Forms.Padding(2, 2, 2, 2);
            this.TextBoxNet.Name = "TextBoxNet";
            this.TextBoxNet.Size = new System.Drawing.Size(150, 20);
            this.TextBoxNet.TabIndex = 0;
            // 
            // TextBoxSource
            // 
            this.TextBoxSource.Location = new System.Drawing.Point(0, 34);
            this.TextBoxSource.Margin = new System.Windows.Forms.Padding(2, 2, 2, 2);
            this.TextBoxSource.Name = "TextBoxSource";
            this.TextBoxSource.Size = new System.Drawing.Size(150, 20);
            this.TextBoxSource.TabIndex = 1;
            // 
            // ButtonNet
            // 
            this.ButtonNet.Location = new System.Drawing.Point(154, 10);
            this.ButtonNet.Margin = new System.Windows.Forms.Padding(2, 2, 2, 2);
            this.ButtonNet.Name = "ButtonNet";
            this.ButtonNet.Size = new System.Drawing.Size(56, 19);
            this.ButtonNet.TabIndex = 2;
            this.ButtonNet.Text = "net";
            this.ButtonNet.UseVisualStyleBackColor = true;
            this.ButtonNet.Click += new System.EventHandler(this.ButtonNet_Click);
            // 
            // ButtonSource
            // 
            this.ButtonSource.Location = new System.Drawing.Point(154, 33);
            this.ButtonSource.Margin = new System.Windows.Forms.Padding(2, 2, 2, 2);
            this.ButtonSource.Name = "ButtonSource";
            this.ButtonSource.Size = new System.Drawing.Size(56, 19);
            this.ButtonSource.TabIndex = 3;
            this.ButtonSource.Text = "source";
            this.ButtonSource.UseVisualStyleBackColor = true;
            this.ButtonSource.Click += new System.EventHandler(this.ButtonSource_Click);
            // 
            // ButtonGo
            // 
            this.ButtonGo.Location = new System.Drawing.Point(154, 102);
            this.ButtonGo.Margin = new System.Windows.Forms.Padding(2, 2, 2, 2);
            this.ButtonGo.Name = "ButtonGo";
            this.ButtonGo.Size = new System.Drawing.Size(56, 19);
            this.ButtonGo.TabIndex = 4;
            this.ButtonGo.Text = "Go";
            this.ButtonGo.UseVisualStyleBackColor = true;
            this.ButtonGo.Click += new System.EventHandler(this.ButtonGo_Click);
            // 
            // RadioDefault
            // 
            this.RadioDefault.AutoSize = true;
            this.RadioDefault.Checked = true;
            this.RadioDefault.Location = new System.Drawing.Point(9, 58);
            this.RadioDefault.Margin = new System.Windows.Forms.Padding(2, 2, 2, 2);
            this.RadioDefault.Name = "RadioDefault";
            this.RadioDefault.Size = new System.Drawing.Size(59, 17);
            this.RadioDefault.TabIndex = 6;
            this.RadioDefault.TabStop = true;
            this.RadioDefault.Text = "Default";
            this.RadioDefault.UseVisualStyleBackColor = true;
            // 
            // RadioStereographic
            // 
            this.RadioStereographic.AutoSize = true;
            this.RadioStereographic.Location = new System.Drawing.Point(9, 80);
            this.RadioStereographic.Margin = new System.Windows.Forms.Padding(2, 2, 2, 2);
            this.RadioStereographic.Name = "RadioStereographic";
            this.RadioStereographic.Size = new System.Drawing.Size(97, 17);
            this.RadioStereographic.TabIndex = 7;
            this.RadioStereographic.TabStop = true;
            this.RadioStereographic.Text = "To Hemisphere";
            this.RadioStereographic.UseVisualStyleBackColor = true;
            // 
            // checkTriangular
            // 
            this.checkTriangular.AutoSize = true;
            this.checkTriangular.Location = new System.Drawing.Point(9, 131);
            this.checkTriangular.Margin = new System.Windows.Forms.Padding(2, 2, 2, 2);
            this.checkTriangular.Name = "checkTriangular";
            this.checkTriangular.Size = new System.Drawing.Size(102, 17);
            this.checkTriangular.TabIndex = 8;
            this.checkTriangular.Text = "Triangular Mesh";
            this.checkTriangular.UseVisualStyleBackColor = true;
            // 
            // radioLagrange
            // 
            this.radioLagrange.AutoSize = true;
            this.radioLagrange.Location = new System.Drawing.Point(9, 102);
            this.radioLagrange.Name = "radioLagrange";
            this.radioLagrange.Size = new System.Drawing.Size(75, 17);
            this.radioLagrange.TabIndex = 9;
            this.radioLagrange.TabStop = true;
            this.radioLagrange.Text = "To Sphere";
            this.radioLagrange.UseVisualStyleBackColor = true;
            // 
            // Form1
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(219, 159);
            this.Controls.Add(this.radioLagrange);
            this.Controls.Add(this.checkTriangular);
            this.Controls.Add(this.RadioStereographic);
            this.Controls.Add(this.RadioDefault);
            this.Controls.Add(this.ButtonGo);
            this.Controls.Add(this.ButtonSource);
            this.Controls.Add(this.ButtonNet);
            this.Controls.Add(this.TextBoxSource);
            this.Controls.Add(this.TextBoxNet);
            this.Margin = new System.Windows.Forms.Padding(2, 2, 2, 2);
            this.Name = "Form1";
            this.Text = "Form1";
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion

        private System.Windows.Forms.TextBox TextBoxNet;
        private System.Windows.Forms.TextBox TextBoxSource;
        private System.Windows.Forms.Button ButtonNet;
        private System.Windows.Forms.Button ButtonSource;
        private System.Windows.Forms.Button ButtonGo;
        private System.Windows.Forms.RadioButton RadioDefault;
        private System.Windows.Forms.RadioButton RadioStereographic;
        private System.Windows.Forms.CheckBox checkTriangular;
        private System.Windows.Forms.RadioButton radioLagrange;
    }
}

