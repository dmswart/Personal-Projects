using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Windows.Forms;

using DMSLib;
using System.Diagnostics;

namespace globemaker
{
    public partial class Form1 : Form
    {
        private RectangleF m_Target;
        private DMSImage m_saveimg;
        private Globemaker m_savegm;
        private String m_outputfilename;

        //accessor
        private void SetTarget( RectangleF value )
        {
            m_Target = value;

        }

        public Form1()
        {
            InitializeComponent();
            SetTarget( RectangleF.Empty );
            m_saveimg = null;
            m_savegm = null;
            m_outputfilename = String.Empty;
        }

        private void buttonBrowseSource_Click(object sender, EventArgs e)
        {
            OpenFileDialog ofd = new OpenFileDialog();
            if (ofd.ShowDialog() == DialogResult.OK)
            {
                textBoxSource.Text = ofd.FileName;
            }
        }

        private void buttonBrowseSkeleton_Click(object sender, EventArgs e)
        {
            OpenFileDialog ofd = new OpenFileDialog();
            ofd.Filter = "Skeleton Files (*.skl)|*.skl|All Files (*.*)|*.*";
            if (ofd.ShowDialog() == DialogResult.OK)
            {
                textBoxSkeleton.Text = ofd.FileName;
            }
        }

        private void buttonPreview_Click(object sender, EventArgs e)
        {
            Globemaker gm;
            if( textBoxSource.Text == "" )
                gm = new Globemaker( panelPreview.Size,
                                     Color.Gray,
                                     new Skeleton(textBoxSkeleton.Text),
                                     0.0);
            else
                gm = new Globemaker( panelPreview.Size,
                                     new DMSImage(textBoxSource.Text, checkBoxMirroBall.Checked),
                                     Color.Gray,
                                     new Skeleton(textBoxSkeleton.Text),
                                     0.0);
            if (m_Target == RectangleF.Empty)
            {
                gm.ExpandTargetToSize();
                SetTarget( gm.Target );
            }
            else
            {
                gm.Target = m_Target;
                gm.ExpandTargetToSize();
                SetTarget( gm.Target );
            }
            panelPreview.BackgroundImage = new DMSImage(gm).Bitmap;
        }

        private void buttonEditSkeleton_Click(object sender, EventArgs e)
        {
            Process pr = new Process();
            pr.StartInfo.FileName = textBoxSkeleton.Text;
            pr.Start();
        }

        private void buttonAutoCrop_Click(object sender, EventArgs e)
        {
            if( m_Target == null || panelPreview.BackgroundImage == null )
                return;

            int mini = panelPreview.BackgroundImage.Width-1;
            int minj = panelPreview.BackgroundImage.Height-1;
            int maxi = 0;
            int maxj = 0;
            int BackgroundColor = Color.Gray.ToArgb();
            for( int j=0; j<panelPreview.BackgroundImage.Height; j++ )
            {
                //deal with flipped y direction
                int revj = (panelPreview.BackgroundImage.Height - 1) - j;
                for (int i = 0; i < panelPreview.BackgroundImage.Width; i++)
                {
                    if( (panelPreview.BackgroundImage as Bitmap).GetPixel(i, j).ToArgb() != BackgroundColor )
                    {
                        mini = Math.Min(i, mini);
                        minj = Math.Min(revj, minj);
                        maxi = Math.Max(i, maxi);
                        maxj = Math.Max(revj, maxj);
                    }
                }
            }

            RectangleF newTarget = new RectangleF( m_Target.X + (mini * m_Target.Width / panelPreview.BackgroundImage.Width),
                                                   m_Target.Y + (minj * m_Target.Height / panelPreview.BackgroundImage.Height),
                                                   (float)(maxi - mini) * m_Target.Width / panelPreview.BackgroundImage.Width,
                                                   (float)(maxj - minj) * m_Target.Height / panelPreview.BackgroundImage.Height);


            double buffer = Math.Max( newTarget.Width * 0.1, newTarget.Height * 0.1 );

            SetTarget( new RectangleF( (float)(newTarget.X - buffer / 2.0),
                                       (float)(newTarget.Y - buffer / 2.0),
                                       (float)(newTarget.Width + buffer),
                                       (float)(newTarget.Height + buffer)) );
            buttonPreview_Click(sender, e);
        }

        private void buttonReset_Click(object sender, EventArgs e)
        {
            SetTarget( RectangleF.Empty );
            buttonPreview_Click(sender, e);
        }

        private void UpdateUI()
        {
            // Output size info
            if (m_Target == RectangleF.Empty)
                textBoxOutputSize.Text = String.Empty;

            textBoxOutputSize.Text = "Scale = " + trackBarScale.Value.ToString() + " pixels / tau radians\r" +
                                     "Output Size = " +
                                     ((int)(m_Target.Width / DMS.TAU * trackBarScale.Value)).ToString() +
                                     " x " +
                                     ((int)(m_Target.Height / DMS.TAU * trackBarScale.Value)).ToString() +
                                     " pixels";

            // Progress
            progressBar1.Value = (int)(100.0 * DMSImage.Progress);
        }

        private void trackBarScale_Scroll(object sender, EventArgs e)
        {
            trackBarScale.Value = ((trackBarScale.Value + 25) / 50) * 50;
            UpdateUI();
        }

        private void backgroundWorker1_DoWork(object sender, DoWorkEventArgs e)
        {
            m_saveimg = null;
            if (m_outputfilename == String.Empty)
                return;
            m_saveimg = new DMSImage(m_savegm);
            m_saveimg.Save(m_outputfilename);
        }

        private void buttonGo_Click(object sender, EventArgs e)
        {
            SaveFileDialog sfd = new SaveFileDialog();
            if (sfd.ShowDialog() != DialogResult.OK)
                return;
            else
                m_outputfilename = sfd.FileName;

            if( textBoxSource.Text == "" )
                m_savegm = new Globemaker( new Size((int)(m_Target.Width / DMS.TAU * trackBarScale.Value), (int)(m_Target.Height / DMS.TAU * trackBarScale.Value)),
                                           Color.Gray,
                                           new Skeleton(textBoxSkeleton.Text),
                                           0.0);
            else
                m_savegm = new Globemaker( new Size( (int)(m_Target.Width / DMS.TAU * trackBarScale.Value), (int)(m_Target.Height / DMS.TAU * trackBarScale.Value)),
                                           new DMSImage(textBoxSource.Text, checkBoxMirroBall.Checked),
                                           Color.Gray,
                                           new Skeleton(textBoxSkeleton.Text),
                                           0.0);
            m_savegm.Target = m_Target;
            backgroundWorker1.RunWorkerAsync();
            timer1.Start();
        }

        private void backgroundWorker1_RunWorkerCompleted(object sender, RunWorkerCompletedEventArgs e)
        {
            timer1.Enabled = false;
            timer1.Stop();
            progressBar1.Value = (int)(100.0 * DMSImage.Progress);
        }

        private void timer1_Tick(object sender, EventArgs e)
        {
            UpdateUI();
        }


    }

}
