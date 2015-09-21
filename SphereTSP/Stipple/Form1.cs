using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Windows.Forms;
using System.Drawing.Drawing2D;

namespace Stipple
{
    public partial class Form1 : Form
    {
        private Stippler m_engine = null;

        public Form1()
        {
            m_engine = null;
            InitializeComponent();
        }

        private void buttonSourceImage_Click(object sender, EventArgs e)
        {
            OpenFileDialog ofd = new OpenFileDialog();
            if (ofd.ShowDialog() == DialogResult.OK)
            {
                textBoxSourceImage.Text = ofd.FileName;
            }
        }

        private void LoadInitial()
        {
            if (textBoxInitial.Text == String.Empty)
            {
                m_engine = new Stippler(Decimal.ToInt32(numericUpDownNumPoints.Value), textBoxSourceImage.Text);
            }
            else
            {
                m_engine = new Stippler(textBoxInitial.Text, textBoxSourceImage.Text);
            }
        }

        private void buttonGo_Click(object sender, EventArgs e)
        {
            LoadInitial();
            backgroundWorkerYinYang.RunWorkerAsync();
            timer1.Start();
        }

        private void buttonTSP_Click(object sender, EventArgs e)
        {
            LoadInitial();
            backgroundWorkerTSP.RunWorkerAsync();
            timer1.Start();
        }

        private void panel1_Paint(object sender, PaintEventArgs e)
        {
            Pen blackpen = new Pen(Color.Black);
            Pen greypen = new Pen(Color.Gray);
            if( panel1.BackgroundImage == null ||
                panel1.BackgroundImage.Width != panel1.Width ||
                panel1.BackgroundImage.Height != panel1.Height )
            {
                panel1.BackgroundImage = new Bitmap(panel1.Width, panel1.Height);
            }

            Graphics g = Graphics.FromImage(panel1.BackgroundImage);
            g.Clear(Color.White);

            double unit = Math.Min(panel1.Height / 2, panel1.Width / 4);
            g.DrawEllipse(greypen, (float)0.0, (float)0.0, (float)(2.0 * unit), (float)(2.0 * unit));
            g.DrawEllipse(greypen, (float)(2.0 * unit), (float)0.0, (float)(2.0 * unit), (float)(2.0 * unit));

            if (m_engine != null)
            {
                lock (m_engine.Cities)
                {
                    if (checkBoxShowCircles.Checked)
                    {
                        for (int i = 0; i < m_engine.Cities.Count; i++)
                        {
                            DMSLib.Point3D pt = new DMSLib.Point3D(m_engine.Cities[i]);
                            double rad = m_engine.GetRadius(i);
                            double minoraxis = rad * pt.Z;

                            pt.R = Math.Cos(rad);

                            rad *= unit;
                            minoraxis *= unit;


                            double U = (pt.Z > 0.0) ?
                                unit + (pt.X * unit) :
                                3 * unit - (pt.X * unit);
                            double V = unit + (pt.Y * unit);
                            double R = (pt.Z > 0.0) ?
                                Math.Atan2(-pt.X, pt.Y) * 180.0 / Math.PI :
                                Math.Atan2(pt.X, pt.Y) * 180.0 / Math.PI;


                            g.RotateTransform((float)R, MatrixOrder.Append);
                            g.TranslateTransform((float)U, (float)V, MatrixOrder.Append);
                            g.DrawEllipse(blackpen,
                                           new RectangleF((float)-rad, (float)-minoraxis, (float)(2.0 * rad), (float)(2.0 * minoraxis)));
                            g.TranslateTransform((float)-U, (float)-V, MatrixOrder.Append);
                            g.RotateTransform((float)-R, MatrixOrder.Append);
                        }
                    }

                    if (checkBoxPath.Checked)
                    {
                        DMSLib.Point3D NextPt = m_engine.Cities[0];
                        double NextU = NextPt.Z > 0.0 ? unit + (NextPt.X * unit) : 3 * unit - (NextPt.X * unit);
                        double NextV = unit + (NextPt.Y * unit);

                        for (int i = 0; i < m_engine.Cities.Count; i++)
                        {
                            DMSLib.Point3D pt = NextPt;
                            double U = NextU;
                            double V = NextV;

                            NextPt = m_engine.Cities[(i + 1) % m_engine.Cities.Count];
                            NextU = NextPt.Z > 0.0 ? unit + (NextPt.X * unit) : 3 * unit - (NextPt.X * unit);
                            NextV = unit + (NextPt.Y * unit);

                            if (pt.Z * NextPt.Z > 0.0)
                            {
                                g.DrawLine(blackpen, (float)U, (float)V, (float)NextU, (float)NextV);
                            }
                        }
                    }
                }
            }
        }

        private void backgroundWorker1_DoWork(object sender, DoWorkEventArgs e)
        {
            m_engine.DoYinYang();

        }

        private void backgroundWorker1_ProgressChanged(object sender, ProgressChangedEventArgs e)
        {
            List<String> progress = m_engine.GetProgressStrings();
            toolStripStatusLabel1.Text = progress[0];
            toolStripStatusLabel2.Text = progress[1];
            toolStripStatusLabel3.Text = progress[2];
            toolStripStatusLabel4.Text = progress[3];
            panel1.Invalidate();
            statusStrip1.Invalidate();
        }

        private void backgroundWorker1_RunWorkerCompleted(object sender, RunWorkerCompletedEventArgs e)
        {
            m_engine.WriteCities("afteryinyang.csv");
            panel1.Invalidate();
            timer1.Enabled = false;
            timer1.Stop();
            toolStripStatusLabel1.Text = "Yin Yang completed";
            panel1.Invalidate();
            statusStrip1.Invalidate();
        }

        private void timer1_Tick(object sender, EventArgs e)
        {
            backgroundWorker1_ProgressChanged(sender, null);
        }


        private void buttonInitial_Click(object sender, EventArgs e)
        {
            OpenFileDialog ofd = new OpenFileDialog();
            if (ofd.ShowDialog() == DialogResult.OK)
            {
                textBoxInitial.Text = ofd.FileName;
            }
        }

        private void backgroundWorkerTSP_DoWork(object sender, DoWorkEventArgs e)
        {
            m_engine.TSP();
        }

        private void buttonHalt_Click(object sender, EventArgs e)
        {
            m_engine.Halt();
        }

        private void backgroundWorkerTSP_ProgressChanged(object sender, ProgressChangedEventArgs e)
        {
            panel1.Invalidate();
        }

        private void backgroundWorkerTSP_RunWorkerCompleted(object sender, RunWorkerCompletedEventArgs e)
        {
            m_engine.WriteCities("aftertsp.csv");
            panel1.Invalidate();
            timer1.Enabled = false;
            timer1.Stop();
            toolStripStatusLabel1.Text = "TSP completed";
            panel1.Invalidate();
            statusStrip1.Invalidate();
        }

        private void buttonDraw_Click(object sender, EventArgs e)
        {
            //LoadInitial();
            SaveFileDialog sfd = new SaveFileDialog();
            if (sfd.ShowDialog() == DialogResult.OK)
            {                
                m_engine.DrawImage(sfd.FileName,
                                    false, // bspline
                                    false, // colors
                                    false, //rotate 90
                                    0.005); //scale factor
            }
            toolStripStatusLabel1.Text = "Draw completed";
            panel1.Invalidate();
            statusStrip1.Invalidate();
        }


    }
}
