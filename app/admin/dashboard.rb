ActiveAdmin.register_page "Dashboard" do

  menu priority: 0, label: proc{ I18n.t("active_admin.dashboard") }

  content title: proc{ I18n.t("active_admin.dashboard") } do
    columns do
      column do
        panel "Analistas" do
          panel "Ativos" do
            table_for Doodle::ReportsHelper.online_users_and_protocols_in_progress do
              column :login
              column :number
            end
          end
          panel "Em Espera" do
            table_for Doodle::ReportsHelper.waiting_users do
              column :login
            end
          end
        end

        panel 'Métricas' do
        end
      end

      column do
        panel 'Protocolos' do
          panel  "Waiting" do
            table_for Doodle::ReportsHelper.protocol_with_status(Doodle::Protocol::STATUSES[:waiting]) do
              column :name
              column :number
            end
          end
          panel  "In Progress" do
            table_for Doodle::ReportsHelper.protocol_with_status(Doodle::Protocol::STATUSES[:in_progress]) do
              column :name
              column :number
            end
          end
          panel  "Finalized" do
            table_for Doodle::ReportsHelper.protocol_with_status(Doodle::Protocol::STATUSES[:finalized]) do
              column :name
              column :number
            end
          end
        end
      end
    end
  end
end
