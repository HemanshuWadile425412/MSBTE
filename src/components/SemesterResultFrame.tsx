import React, { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/useAuth';

interface SemesterResultFrameProps {
  onBackToDashboard: () => void;
  showToast?: (text: string, type?: 'success' | 'error') => void;
}

export const SemesterResultFrame: React.FC<SemesterResultFrameProps> = ({
  onBackToDashboard,
  showToast,
}) => {
  const { user } = useAuth();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Synchronize Supabase database with the HTML Calculator
  useEffect(() => {
    const sendDataToIframe = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('predicted_results')
          .select('result_data')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!error && data?.result_data && iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage(
            { type: 'INIT_RESULT_DATA', payload: data.result_data },
            '*'
          );
        }
      } catch (err) {
        console.error('Error fetching predicted result from Supabase:', err);
      }
    };

    const handleMessage = async (event: MessageEvent) => {
      if (!event.data || typeof event.data !== 'object') return;

      if (event.data.type === 'CALCULATOR_READY') {
        sendDataToIframe();
      } else if (event.data.type === 'SAVE_RESULT_DATA') {
        if (!user) return;
        const payload = event.data.payload;
        try {
          const { error } = await supabase
            .from('predicted_results')
            .upsert(
              {
                user_id: user.id,
                result_data: payload,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'user_id' }
            );

          if (error) {
            iframeRef.current?.contentWindow?.postMessage(
              { type: 'SAVE_RESULT_ERROR', error: error.message },
              '*'
            );
            showToast?.('Failed to save to Supabase: ' + error.message, 'error');
          } else {
            iframeRef.current?.contentWindow?.postMessage(
              { type: 'SAVE_RESULT_SUCCESS' },
              '*'
            );
            showToast?.('Predicted result saved to Supabase');
          }
        } catch (err) {
          console.error('Error saving predicted result to Supabase:', err);
          showToast?.('Could not save result to Supabase', 'error');
        }
      } else if (event.data.type === 'NAVIGATE_HOME') {
        onBackToDashboard();
      } else if (event.data.type === 'RESET_RESULT_DATA') {
        if (!user) return;
        try {
          await supabase.from('predicted_results').delete().eq('user_id', user.id);
          showToast?.('Predicted result reset in database');
        } catch (err) {
          console.error('Error resetting predicted result:', err);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [user, onBackToDashboard, showToast]);

  return (
    <div className="w-full h-[calc(100vh-3.5rem)] -mx-4 sm:-mx-6 -my-6 sm:-my-8 bg-[#eef0f3] overflow-hidden">
      <iframe
        ref={iframeRef}
        src="/semester5_editable_result_calculator.html"
        title="Semester 5 Editable Result Calculator"
        className="w-full h-full border-0 block"
      />
    </div>
  );
};
